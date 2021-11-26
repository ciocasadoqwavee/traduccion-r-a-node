import {
  ParamData,
  SiteData,
  WthData,
  InitData,
  DataResult,
  DataOutput,
} from "./models";
import {
  read,
  diff,
  sort,
  sum,
  mean,
  fromJsonToCsv,
  fromArrayToObject,
} from "./utils";

async function IPCCTier2SOMmodel(
  SiteDataFilePath: string = "./SiteDataFile_Villegas_NT.csv",
  WthFilePath: string = "./weather_Villegas.csv",
  ParameterFilePath: string = "./default_parameters_Villegas.csv",
  init: InitData
) {
  const params: ParamData[] = await read.csv(ParameterFilePath);
  const SiteData: SiteData[] = await read.csv(SiteDataFilePath);
  const wth: WthData[] = await read.csv(WthFilePath);

  const tillfac_FT: number = params[0].value; // tillage disturbance modifier tilled soil (Full Till)
  const tillfac_RT: number = params[1].value; // tillage disturbance modifier tilled soil (Reduce Till)
  const wfac_irri: number = params[2].value; // wfac for irrigated field during the irrigation period
  const k10: number = params[3].value; // decay rate under optimum conditions for metabolic litter pool
  const k20: number = params[4].value; // decay rate under optimum condition for structural litter pool
  const k30: number = params[5].value; // decay rate under optimum condition for active
  const k40: number = params[6].value; // decay rate under optimum condition for slow
  const k50: number = params[7].value; // decay rate under optimum condition for passive
  const f1: number = params[8].value; // stabilization efficiencies for metabolic decay products entering the active pool
  const f2: number = params[9].value; // stabilization efficiencies for structural decay products entering the active pool
  const f3: number = params[10].value; // stabilization efficiencies for structural decay products entering the slow pool
  const f5: number = params[11].value; // stabilization efficiencies for active pool decay products entering the passive pool
  const f6: number = params[12].value; // stabilization efficiencies for slow pool decay products entering the passive pool
  const f7: number = params[13].value; // stabilization efficiencies for slow pool decay products entering the active pool
  const f8: number = params[14].value; // stabilization efficiencies for passive pool decay products entering the active pool
  const tmax: number = params[15].value; // maximum temperature on decomposition
  const topt: number = params[16].value; // optimum temperature on decomposition
  const plig: number = params[17].value; // empirical parameter to modify k20

  const years = sort(SiteData.map((x) => x.year));
  const ydiff = diff(years);
  const yflag = sum(ydiff.map((x) => x != 1));

  if (yflag !== 0) {
    return console.log(
      `consecutive year needed for site ${SiteDataFilePath}, and TreatmentID.`
    );
  }
  const cflag1: string[] = [
    "site",
    "year",
    "sand",
    "cinput",
    "ligfrac",
    "nfrac",
    "irrig",
    "till",
  ];
  const amountOfPropsMissing: number = cflag1.filter(
    (property) => !SiteData[0].hasOwnProperty(property)
  ).length;
  if (amountOfPropsMissing > 1) {
    return console.log("check your SiteData file format");
  }

  const wflag: boolean = years.every((x) => wth.some((y) => y.year === x));
  if (!wflag)
    return console.log(
      "wth file must have all the data associated with years in SiteData"
    );

  const cflag2: string[] = ["year", "month", "tavg", "mappet"];
  if (!cflag2.every((property) => wth[0].hasOwnProperty(property))) {
    return console.log("check your wth file format.");
  }
  if (Object.keys(params).length !== 18) {
    return console.log("there must be 18 parameters.");
  }
  let SOMstocks = null;
  let Isom1: number = init.active;
  let Isom2: number = init.slow;
  let Isom3: number = init.passive;
  let dataResult: DataResult = {
    site: [],
    year: [],
    dfac: [],
    kA: [],
    SS_active: [],
    active: [],
    kS: [],
    SS_slow: [],
    slow: [],
    kP: [],
    SS_passive: [],
    passive: [],
    TotSOC: [],
    deltaSOC: [],
  };
  for (const year of years) {
    const site: number = SiteData.find((x) => x.year === year).site;
    const cinput: number = SiteData.find((x) => x.year === year).cinput;
    const TILL: string = SiteData.find((x) => x.year === year).till;
    const sand: number = SiteData.find((x) => x.year === year).sand;
    const L: number = SiteData.find((x) => x.year === year).ligfrac; // lignin fraction of cinput
    const N: number = SiteData.find((x) => x.year === year).nfrac; // nitrogen fraction of cinput
    const mtemp: number[] = wth
      .filter((x) => x.year === year)
      .map((x) => x.tavg);
    let mappet: number[] = wth
      .filter((x) => x.year === year)
      .map((x) => x.mappet);

    const IRRIG: number[] = wth.map((x) => {
      if (x.year === year) return Number(x.irrig);
    });
    if (mappet.length !== 12)
      return console.log(
        `Length of mappet must be 12. It is not 12, ${mappet.length}`
      );

    if (mtemp.length !== 12)
      return console.log(
        `Length of monthly average temperature must be 12. It is not 12, ${mtemp.length}`
      );

    mappet = mappet.map((x) => (x > 1.25 ? 1.25 : x));
    let wfac = mappet.map((x) => 0.2129 + 0.9303 * x - 0.2413 * x * x);
    wfac = wfac.map((x) => (x > 1 ? 1 : x < 0 ? 0 : x));

    for (let i = 0; i < IRRIG.length; i++)
      if (IRRIG[i] === 1) wfac[i] = wfac_irri;
    const tfac: number[] = mtemp.map(
      (x) =>
        Math.pow((tmax - x) / (tmax - topt), 0.2) *
        Math.exp(
          (0.2 / 2.63) * (1 - Math.pow((tmax - x) / (tmax - topt), 2.63))
        )
    );
    tfac.forEach((x, i) => {
      if (isNaN(x)) tfac[i] = 0.0001;
    });
    wfac = wfac.map((x) => x * 1.5);
    let dfac: number = mean(wfac) * mean(tfac);
    dfac = dfac <= 0.0001 ? 0.0001 : dfac;

    let tillfac: number;
    if (TILL === "FT") tillfac = tillfac_FT;
    else if (TILL === "RT") tillfac = tillfac_RT;
    else if (TILL === "NT") tillfac = 1;
    else
      return console.log(
        `Tillage ${TILL} not recognized. Must be FT, RT, or NT.`
      );
    const f4: number = Math.min(
      1,
      Math.max(1.0 - f5 - (0.17 + 0.68 * sand), 0)
    );
    const Beta: number =
      cinput * Math.min(0.999, Math.max(0.85 - 0.018 * (L / N), 0));

    const alpha: number =
      (Beta * f1 +
        (cinput * (1 - L) - Beta) * f2 +
        cinput * L * f3 * (Number(f7) + Number((f6 * f8).toFixed(5)))) /
      (1 - f4 * f7 - f5 * f8 - f4 * Number((f6 * f8).toFixed(5)));

    const kst: number = k10 * dfac;
    const kmt: number =
      k20 *
      dfac *
      Math.exp((-1 * plig * L) / (1 - (0.85 - 0.018 * (L / N)))) *
      tillfac;
    const ka: number = k30 * dfac * (0.25 + 0.75 * sand) * tillfac;
    const ks: number = k40 * dfac * tillfac;
    const kp: number = k50 * dfac;
    const SS_som1: number = alpha / ka;
    const SS_som2: number = (cinput * L * f3 + SS_som1 * ka * f4) / ks;
    const SS_som3: number = (SS_som1 * ka * f5 + SS_som2 * ks * f6) / kp;
    const som1: number = Isom1 + (SS_som1 - Isom1) * (ka > 1 ? 1 : ka);
    const som2: number = Isom2 + (SS_som2 - Isom2) * (ks > 1 ? 1 : ks);
    const som3: number = Isom3 + (SS_som3 - Isom3) * (kp > 1 ? 1 : kp);
    const somsc: number = som1 + som2 + som3;
    const delta_som: number = somsc - (Isom1 + Isom2 + Isom3);

    Isom1 = som1;
    Isom2 = som2;
    Isom3 = som3;

    dataResult.site.push(site);
    dataResult.year.push(year);
    dataResult.dfac.push(dfac);
    dataResult.kA.push(ka);
    dataResult.SS_active.push(SS_som1);
    dataResult.active.push(som1);
    dataResult.kS.push(ks);
    dataResult.SS_slow.push(SS_som2);
    dataResult.slow.push(som2);
    dataResult.kP.push(kp);
    dataResult.SS_passive.push(SS_som3);
    dataResult.passive.push(som3);
    dataResult.TotSOC.push(somsc);
    dataResult.deltaSOC.push(delta_som);
  }
  // console.log(dataResult);
  fromJsonToCsv(dataResult, "ts-result.csv");
}

// IPCCTier2SOMmodel(
//   "./data/SiteDataFile_Villegas_FT.csv",
//   "./data/weather_Villegas.csv",
//   "./data/default_parameters_Villegas.csv",
//   { active: 100, slow: 1000, passive: 7000 }
// );

const realDataPath = "./realDataPath.csv";
const newDataPath = "./newDataPath.csv";

async function calculateError(realDataPath: string, newDataPath: string) {
  const realData: DataOutput[] = await read.csv(realDataPath);
  const newData: DataOutput[] = await read.csv(newDataPath);
  let sum: number = 0;
  let counter: number = 0;
  const error: DataOutput[] = [];
  for (let i = 0; i < realData.length; i++) {
    let data: any = {};
    for (const [key, value] of Object.entries(realData[i])) {
      const error = Math.abs(Number(value) - Number(newData[i][key]));
      sum += error;
      counter++;
      data[key] = error;
    }
    error.push(data);
  }
  const averageError: number = sum / counter;
  console.log(averageError);

  // console.log(error);
 fromJsonToCsv(fromArrayToObject(error), "error.csv");
}

calculateError(realDataPath, newDataPath);
