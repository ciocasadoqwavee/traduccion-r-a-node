IPCCTier2SOMmodel <- function 
							  IPCCTier2SOMmodel(SiteDataFile="./SiteDataFile_Villegas_NT.csv",
							  WthFile="./weather_Villegas.csv",
							  ParameterFile="./default_parameters_Villegas.csv",
							  init.active=100,
                              init.slow=1000,
							  init.passive=7000
){



  params <- read.csv(ParameterFile,header=TRUE,sep=",",dec=".")
  SiteData <- read.csv(SiteDataFile,header=TRUE,sep=",",dec=".")
  wth <- read.csv(WthFile,header=TRUE,sep=",",dec=".")


	tillfac_FT   = params$value[1]               # tillage disturbance modifier tilled soil (Full Till)
	tillfac_RT   = params$value[2]               # tillage disturbance modifier tilled soil (Reduce Till)
	wfac_irri    = params$value[3]               # wfac for irrigated field during the irrigation period
	k10          = params$value[4]               # decay rate under optimum conditions for metabolic litter pool
	k20          = params$value[5]               # decay rate under optimum condition for structural litter pool
	k30          = params$value[6]               # decay rate under optimum condition for active
	k40          = params$value[7]               # decay rate under optimum condition for slow
	k50          = params$value[8]               # decay rate under optimum condition for passive
	f1           = params$value[9]               # stabilization efficiencies for metabolic decay products entering the active pool 
	f2           = params$value[10]              # stabilization efficiencies for structural decay products entering the active pool
	f3           = params$value[11]              # stabilization efficiencies for structural decay products entering the slow pool
	f5           = params$value[12]              # stabilization efficiencies for active pool decay products entering the passive pool
	f6           = params$value[13]              # stabilization efficiencies for slow pool decay products entering the passive pool
	f7           = params$value[14]              # stabilization efficiencies for slow pool decay products entering the active pool
	f8           = params$value[15]              # stabilization efficiencies for passive pool decay products entering the active pool
	tmax         = params$value[16]              # maximum temperature on decomposition
	topt         = params$value[17]              # optimum temperature on decomposition
	plig         = params$value[18]              # empirical parameter to modify k20

	years  <- sort(SiteData$year)
	ydiff      <- diff(years)
	yflag      <- sum(ydiff != 1)
	if(yflag != 0){
		stop(paste("consecutive year needed for site ", SiteName, " and TreatmentID ", trt, sep = ""))
	}
	cflag1 <- sum(!is.element(c("site", "year", "sand", "cinput", "ligfrac", "nfrac", "irrig", "till"), names(SiteData)))
	if(cflag1 > 1){
		stop("check your SiteData file format.")
	}
	wflag <- sum(is.element(years, wth$year))
	if(wflag != length(years)){
		stop("wth file must have all the data associated with years in SiteData")
	}
	cflag2 <- sum(!is.element(c("year", "month", "tavg", "mappet"), names(wth)))
	if(cflag2 > 1){
		stop("check your wth file format.")
	}
	if(length(params$value) != 18){
		stop("there must be 18 parameters.")
	}
	SOMstocks <- NULL
	Isom1   <- init.active
	Isom2   <- init.slow
	Isom3   <- init.passive


	for(year in years){
		site       <- SiteData$site[SiteData$year == year]
	  cinput     <- SiteData$cinput[SiteData$year == year]
		TILL       <- SiteData$till[SiteData$year == year]
		sand       <- SiteData$sand[SiteData$year == year]
		L          <- SiteData$ligfrac[SiteData$year == year]    # lignin fraction of cinput
		N          <- SiteData$nfrac[SiteData$year == year]      # nitrogen fraction of cinput
		mtemp      <- as.numeric(wth$tavg[wth$year == year])
		mappet     <- as.numeric(wth$mappet[wth$year == year])
		IRRIG      <- as.numeric(wth$irrig[wth$year == year])
		if(length(mappet) != 12){
			stop("Length of mappet must be 12. It is not 12", length(mappet))
		}
		if(length(mtemp) != 12){
			stop("Length of monthly average temperature must be 12. It is not 12", length(mtemp))
		}
		mappet <- ifelse(mappet > 1.25, 1.25, mappet)
		wfac <- (0.2129 + 0.9303 * (mappet) - 0.2413 * (mappet^2))
		wfac <- ifelse(wfac > 1, 1, ifelse(wfac<0, 0, wfac))
		if(any(IRRIG == 1)){
			wfac[IRRIG == 1] <- wfac_irri
		}
		tfac <- ((tmax - mtemp)/(tmax - topt))^0.2 * (exp(0.2/2.63 * (1-((tmax - mtemp)/(tmax - topt))^2.63)))
		tfac[is.na(tfac)] <- 0.0001
		wfac <- wfac*1.5
		dfac <- mean(wfac)*mean(tfac) 
		dfac <- ifelse(dfac <= 0.0001, 0.0001, dfac)
		if(TILL == "FT"){
			tillfac <- tillfac_FT
		}else if(TILL == "RT"){
			tillfac <- tillfac_RT
		}else if(TILL == "NT"){
			tillfac <- 1
		}else{
			stop(message("Tillage ", TILL, " not recognized. Must be FT, RT, or NT."))
		}
		f4     <- min(1, max((1.0 - f5 - (0.17 + 0.68 * sand)),0))
		Beta   <- cinput * min(0.999, max((0.85 - 0.018 * (L/N)),0))
		alpha  <- ((Beta * f1) + ((cinput * (1 - L) - Beta) * f2) + (cinput * L * f3 * (f7 + f6 * f8)))/
		  (1 - f4 * f7 - f5 * f8 - f4 * f6 * f8)
		kst <- k10 * dfac
		kmt <- k20 * dfac * exp((-1 * plig) * L/(1 - (0.85 - 0.018 * (L/N)))) * tillfac
		ka <- k30 * dfac * (0.25 + 0.75 * sand) * tillfac
		ks <- k40 * dfac * tillfac
		kp <- k50 * dfac
		SS_som1   <- alpha/ka
		SS_som2   <- ((cinput * L) * f3 + (SS_som1 * ka * f4))/ks
		SS_som3   <- ((SS_som1 * ka * f5) + (SS_som2 * ks * f6))/kp
		som1   <- Isom1 + (SS_som1 - Isom1)*ifelse(ka > 1, 1, ka)
		som2   <- Isom2 + (SS_som2 - Isom2)*ifelse(ks > 1, 1, ks)
		som3   <- Isom3 + (SS_som3 - Isom3)*ifelse(kp > 1, 1, kp)
		somsc <- som1 + som2 + som3
		delta.som <- somsc - (Isom1+Isom2+Isom3)
		tempSOM <- data.frame("site" = site, "year" = year, "dfac" = dfac, 
							  "kA" = ka, "SS_active" = SS_som1, "active" = som1,
							  "kS" = ks, "SS_slow" = SS_som2, "slow" = som2,
							  "kP" = kp, "SS_passive" = SS_som3, "passive" = som3,
							  "TotSOC" = somsc, "deltaSOC" = delta.som, stringsAsFactors = F)
		SOMstocks <- rbind(SOMstocks, tempSOM)
		Isom1   <- som1
		Isom2   <- som2
		Isom3   <- som3
	}

	return(SOMstocks)
}
