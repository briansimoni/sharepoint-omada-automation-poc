<#
    Script description.

    Some notes.
#>
param (
    # height of largest column without top bar
    [int]$h = 4000,
    
    # name of the site
    [string]$siteName
)

$user = 'svc_sharepoint_scripts@stereodose.onmicrosoft.com'
$password = $ENV:SHAREPOINT_SECRET
$cred = New-Object -TypeName System.Management.Automation.PSCredential -argumentlist $user, $(convertto-securestring $password -asplaintext -force)

Connect-SPOService -Url "https://stereodose-admin.sharepoint.com" -Credential $cred

$sites = Get-SpoSite
$sites | ConvertTo-Json | Write-Host