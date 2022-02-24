<#
    Script description.

    Some notes.
#>
param (
    # name of the site
    [Parameter(Mandatory=$true)]
    [string]$site,

    [Parameter(Mandatory=$true)]
    [string]$securityGroup,

    [Parameter(Mandatory=$true)]
    [string]$spGroup
)

$user = 'svc_sharepoint_scripts@stereodose.onmicrosoft.com'
$password = $ENV:SHAREPOINT_SECRET
$cred = New-Object -TypeName System.Management.Automation.PSCredential -argumentlist $user, $(convertto-securestring $password -asplaintext -force)

Connect-SPOService -Url "https://stereodose-admin.sharepoint.com" -Credential $cred

Add-SPOUser -Site "https://stereodose.sharepoint.com/sites/$site" -LoginName $securityGroup -Group $spGroup
