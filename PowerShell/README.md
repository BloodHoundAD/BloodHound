This is a version of PowerSploit's [PowerView](https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1) customized for BloodHound data collection and ingestion.

It will be kept as a separate instance from PowerView and not kept in sync with the PowerSploit branch.

## BloodHound Functions:

    Export-BloodHoundData   -   Exports PowerView object data to a BloodHound RESTapi instance
    Get-BloodHoundData      -   Queries for machines in the current domain with Get-NetComputer 
                                and enumerates sessions/logged on users as well as local administrators. 
                                Ships all data off to a BloodHound RESTapi instance with Export-BloodHoundData.

