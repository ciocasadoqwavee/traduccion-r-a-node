async function IPCCTier2SOMmodel(
  SiteDataFilePath = "NAME",
  WthFilePath = "NAME",
  ParameterFilePath = "NAME",
  active = 100,
  slow = 1000,
  passive = 7000
) {



  const params: ParamData[] = await read.csv(ParameterFilePath);
  const SiteData: SiteData[] = await read.csv(SiteDataFilePath);
  const wth: WthData[] = await read.csv(WthFilePath);

  
  let paramsDataValues: ParamsDataValues;
  for (const param of params) paramsDataValues[param.Parameter] = param.Value;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const years = sort(SiteData.map((x) => x.year))
  const ydiff = diff(years)
  const yflag = sum(ydiff)  
  if(yflag !== 0){
    return console.log(`consecutive year needed for site ${SiteDataFilePath}, and TreatmentID.`)
  }
  const cflag1: string[] = ["site", "year", "sand", "cinput", "ligfrac", "nfrac", "irrig", "till"];
  if (!cflag1.every(property => SiteData[0].hasOwnProperty(property))) {
    return console.log("check your SiteData file format");
  }
  years.forEach((year) => {
    if (wth.some((value) => value.year === year))
      return console.log(`wth file must have all the data associated with years in SiteData`);
  });
  const cflag2: string[] = ["year", "month", "tavg", "mappet"];
  if (!cflag2.every(property => wth[0].hasOwnProperty(property))) {
    return console.log("check your wth file format.");
  }
  if(Object.keys(params).length !== 18){
    return console.log("there must be 18 parameters.");
  }
  let SOMstocks = null;
  const Isom1 = active;
  const Isom2 = slow;
  const Isom3 = passive;


  // SOMstocks <- NULL
  // Isom1   <- init.active
  // Isom2   <- init.slow
  // Isom3   <- init.passive

  // for(year in years){
  // 	site       <- SiteData$site[SiteData$year == year]
  //   cinput     <- SiteData$cinput[SiteData$year == year]
  // 	TILL       <- SiteData$till[SiteData$year == year]
  // 	sand       <- SiteData$sand[SiteData$year == year]
  // 	L          <- SiteData$ligfrac[SiteData$year == year]    # lignin fraction of cinput
  // 	N          <- SiteData$nfrac[SiteData$year == year]      # nitrogen fraction of cinput
  // 	mtemp      <- as.numeric(wth$tavg[wth$year == year])
  // 	mappet     <- as.numeric(wth$mappet[wth$year == year])
  // 	IRRIG      <- as.numeric(wth$irrig[wth$year == year])
  // 	if(length(mappet) != 12){
  // 		stop("Length of mappet must be 12. It is not 12", length(mappet))
  // 	}
  // 	if(length(mtemp) != 12){
  // 		stop("Length of monthly average temperature must be 12. It is not 12", length(mtemp))
  // 	}
  // 	mappet <- ifelse(mappet > 1.25, 1.25, mappet)
  // 	wfac <- (0.2129 + 0.9303 * (mappet) - 0.2413 * (mappet^2))
  // 	wfac <- ifelse(wfac > 1, 1, ifelse(wfac<0, 0, wfac))
  // 	if(any(IRRIG == 1)){
  // 		wfac[IRRIG == 1] <- wfac_irri
  // 	}
  // 	tfac <- ((tmax - mtemp)/(tmax - topt))^0.2 * (exp(0.2/2.63 * (1-((tmax - mtemp)/(tmax - topt))^2.63)))
  // 	tfac[is.na(tfac)] <- 0.0001
  // 	wfac <- wfac*1.5
  // 	dfac <- mean(wfac)*mean(tfac)
  // 	dfac <- ifelse(dfac <= 0.0001, 0.0001, dfac)
  // 	if(TILL == "FT"){
  // 		tillfac <- tillfac_FT
  // 	}else if(TILL == "RT"){
  // 		tillfac <- tillfac_RT
  // 	}else if(TILL == "NT"){
  // 		tillfac <- 1
  // 	}else{
  // 		stop(message("Tillage ", TILL, " not recognized. Must be FT, RT, or NT."))
  // 	}
  // 	f4     <- min(1, max((1.0 - f5 - (0.17 + 0.68 * sand)),0))
  // 	Beta   <- cinput * min(0.999, max((0.85 - 0.018 * (L/N)),0))
  // 	alpha  <- ((Beta * f1) + ((cinput * (1 - L) - Beta) * f2) + (cinput * L * f3 * (f7 + f6 * f8)))/
  // 	  (1 - f4 * f7 - f5 * f8 - f4 * f6 * f8)
  // 	kst <- k10 * dfac
  // 	kmt <- k20 * dfac * exp((-1 * plig) * L/(1 - (0.85 - 0.018 * (L/N)))) * tillfac
  // 	ka <- k30 * dfac * (0.25 + 0.75 * sand) * tillfac
  // 	ks <- k40 * dfac * tillfac
  // 	kp <- k50 * dfac
  // 	SS_som1   <- alpha/ka
  // 	SS_som2   <- ((cinput * L) * f3 + (SS_som1 * ka * f4))/ks
  // 	SS_som3   <- ((SS_som1 * ka * f5) + (SS_som2 * ks * f6))/kp
  // 	som1   <- Isom1 + (SS_som1 - Isom1)*ifelse(ka > 1, 1, ka)
  // 	som2   <- Isom2 + (SS_som2 - Isom2)*ifelse(ks > 1, 1, ks)
  // 	som3   <- Isom3 + (SS_som3 - Isom3)*ifelse(kp > 1, 1, kp)
  // 	somsc <- som1 + som2 + som3
  // 	delta.som <- somsc - (Isom1+Isom2+Isom3)
  // 	tempSOM <- data.frame("site" = site, "year" = year, "dfac" = dfac,
  // 						  "kA" = ka, "SS_active" = SS_som1, "active" = som1,
  // 						  "kS" = ks, "SS_slow" = SS_som2, "slow" = som2,
  // 						  "kP" = kp, "SS_passive" = SS_som3, "passive" = som3,
  // 						  "TotSOC" = somsc, "deltaSOC" = delta.som, stringsAsFactors = F)
  // 	SOMstocks <- rbind(SOMstocks, tempSOM)
  // 	Isom1   <- som1
  // 	Isom2   <- som2
  // 	Isom3   <- som3
  // }

  // return(SOMstocks)
}


const read = {
  csv: function (path): Promise<any[]> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, function (err, data) {
        if (err) {
          reject(err);
        }
        parse(data, { columns: true }, function (err, output) {
          if (err) {
            reject(err);
          }
          resolve(output);
        });
      });
    });
  },
};


function getParseCsv(path): Promise<any[]> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, function (err, data) {
      if (err) {
        reject(err);
      }
      parse(data, { columns: true }, function (err, output) {
        if (err) {
          reject(err);
        }
        resolve(output);
      });
    });
  });
}

function diff(array){
    var arrayOfDiffs = [];
    for(var i = 0; i < array.length -1; i++){
        var diff = array[i+1] - array[i];
        arrayOfDiffs.push(diff);
    }
    return arrayOfDiffs;
}



function sort(array){
    var sortedArray = array.sort(function (a, b) {
        return a - b;
    });
    return sortedArray;
}

function sum(array){
    var sum = 0;
    for(var i = 0; i < array.length; i++)
        sum += array[i];
    return sum;
}

export interface ParamsDataValues {
  tillfac_FT: number; // tillage disturbance modifier tilled soil (Full Till)
  tillfac_RT: number; // tillage disturbance modifier tilled soil (Reduce Till)
  wfac_irri: number; // wfac for irrigated field during the irrigation period
  k10: number; // decay rate under optimum conditions for metabolic litter pool
  k20: number; // decay rate under optimum condition for structural litter pool
  k30: number; // decay rate under optimum condition for active
  k40: number; // decay rate under optimum condition for slow
  k50: number; // decay rate under optimum condition for passive
  f1: number; // stabilization efficiencies for metabolic decay products entering the active pool
  f2: number; // stabilization efficiencies for structural decay products entering the active pool
  f3: number; // stabilization efficiencies for structural decay products entering the slow pool
  f5: number; // stabilization efficiencies for active pool decay products entering the passive pool
  f6: number; // stabilization efficiencies for slow pool decay products entering the passive pool
  f7: number; // stabilization efficiencies for slow pool decay products entering the active pool
  f8: number; // stabilization efficiencies for passive pool decay products entering the active pool
  tmax: number; // maximum temperature on decomposition
  topt: number; // optimum temperature on decomposition
  plig: number; // empirical parameter to modify k20
}

export interface ParamData {
  Parameter: string;
  Value: number;
  Description: string;
}

export interface SiteData {
  site: string;
  year: string;
  sand: string;
  cinput: string;
  ligfrac: string;
  nfrac: string;
  till: string;
}

export interface WthData {
  year: number
  month: number
  tavg: number
  mappet: number
  irrig: number
}

import { fs } from "fs";
import { parse } from "csv-parse";
