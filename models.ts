export interface ParamData {
  parameter: string;
  value: number;
  description: string;
}

export interface SiteData {
  site: number;
  year: number;
  sand: number;
  cinput: number;
  ligfrac: number;
  nfrac: number;
  till: string;
}

export interface WthData {
  year: number;
  month: number;
  tavg: number;
  mappet: number;
  irrig: number;
}

export interface InitData{
    active: number
    slow: number
    passive: number
}

export interface DataResult{
  site: number[]
  year: number[]
  dfac: number[]
  kA: number[]
  SS_active: number[]
  active: number[]
  kS: number[]
  SS_slow: number[]
  slow: number[]
  kP: number[]
  SS_passive: number[]
  passive: number[]
  TotSOC: number[]
  deltaSOC: number[]
}