const { spawn } = require('child_process')
const path = require('path')

async function getSites () {
  const sites = await runPowerShell('get-sites.ps1')
  return JSON.parse(sites)
}

/**
 * create a new sharepoint site
 * the svc account will be the owner
 * @param {String} siteName
 */
async function createSite (siteName) {
  const result = await runPowerShell('create-site.ps1', ['-siteName', siteName])
  return result
}

/**
 * gets the groups for a particular sharepoint site
 * @param {String} site
 * @returns {Array}
 * [
    {
        "LoginName":  "test Members",
        "Title":  "test Members",
        "OwnerLoginName":  "test Owners",
        "OwnerTitle":  "test Owners",
        "Users":  [
                      "c5eabe79-de53-4bb6-9406-fbc7eb0b7f7f",
                      "0d205731-6791-40ed-9618-f18591a70329"
                  ],
        "Roles":  [
                      "Edit"
                  ]
    },
    ...
 */
async function getGroups (site) {
  const groups = await runPowerShell('get-groups.ps1', ['-site', site])
  return JSON.parse(groups)
}

/**
 * Adds a security group to a SharePoint site
 * @param {String} site
 * @param {Object} securityGroup Azure security group name. ex: whatever@place.onmicrosoft.com
 * @param {String} spGroup Name of the SharePoint group
 */
async function addSecurityGroupToSiteGroup (site, securityGroup, spGroup) {
  const result = await runPowerShell('add-group.ps1', ['-site', site, '-securityGroup', securityGroup.displayName, '-spGroup', `"${spGroup}"`])
  const groups = await getGroups(site)
  const targetSpGroup = groups.find(g => g.LoginName.includes(spGroup))
  if (targetSpGroup.Users.includes(securityGroup.id)) {
    return
  } else {
    console.log('Security group not found in sp group. Retrying in 10 seconds...')
    setTimeout(() => {
      addSecurityGroupToSiteGroup(site, securityGroup, spGroup)
    }, 10000)
  }
  return result
}

/**
 * runs the actual powershell script
 * @param {String} script
 * @param {Array} args
 * @returns {Object}
 */
async function runPowerShell (script, args = []) {
  const scriptPath = path.join(__dirname, 'powershell', script)
  return new Promise((resolve, reject) => {
    const chunks = []
    const errorChunks = []

    console.log([scriptPath, ...args])
    const cmdlet = spawn('powershell', [scriptPath, ...args])

    cmdlet.stdout.on('data', (data) => {
      chunks.push(data)
    })

    cmdlet.stderr.on('data', (data) => {
      errorChunks.push(data)
    })

    cmdlet.on('error', (error) => {
      reject(error)
    })

    cmdlet.on('close', (code) => {
      console.log('cmdlet done with code', code)
      if (code === 0) {
        const result = Buffer.concat(chunks)
        resolve(String(result))
      } else {
        const result = Buffer.concat(errorChunks)
        reject(new Error(String(result)))
      }
    })
  })
}

module.exports = {
  getSites,
  createSite,
  getGroups,
  addSecurityGroupToSiteGroup
}
