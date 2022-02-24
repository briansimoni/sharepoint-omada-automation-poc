<#
    Script description.

    Some notes.
#>
param (
    # name of the site
    [Parameter(Mandatory=$true)]
    [string]$site
)

$user = 'svc_sharepoint_scripts@stereodose.onmicrosoft.com'
$password = $ENV:SHAREPOINT_SECRET
$cred = New-Object -TypeName System.Management.Automation.PSCredential -argumentlist $user, $(convertto-securestring $password -asplaintext -force)

Connect-SPOService -Url "https://stereodose-admin.sharepoint.com" -Credential $cred

New-SPOSite -Url "https://stereodose.sharepoint.com/sites/$site" -Owner svc_sharepoint_scripts@stereodose.onmicrosoft.com -StorageQuota 1000 -Title $site
