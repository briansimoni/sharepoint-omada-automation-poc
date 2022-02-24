/**
 * Consumes messages from the queue
 * and creates resources in Omada
 */
const httpntlm = require('httpntlm')
const { Queue } = require('./queue')

async function getAADGroupFromOmada (group) {
  return new Promise((resolve, reject) => {
    httpntlm.get({
      url: `http://enterpriseserver/OData/DataObjects/resource?$filter=NAME%20eq%20%27${group}%27`,
      username: 'salesadm',
      password: 'Omadasales1!',
      domain: 'corporate'
    }, function (err, res) {
      if (err) {
        return reject(err.message)
      }
      const data = JSON.parse(res.body)
      const group = data.value[0]
      resolve(group)
    })
  })
}

async function createSharePointResource (AADGroup, omadaAADGroup) {
  const newResource = {
    DisplayName: AADGroup.displayName,
    NAME: AADGroup.displayName,
    DESCRIPTION: 'This was created with automation. Ideally we would put a good description here',
    ROLEID: `APP_SHAREPOINT_ONLINE_${AADGroup.displayName}`,
    SYSTEMREF: {
      Id: 1026344,
      Uid: 'fed53f66-4656-4fb1-a35c-46ecd3677e5a',
      Keyvalue: null,
      KeyProperty: null,
      DisplayName: 'SharePoint Online'
    },
    ROLECATEGORY: {
      Id: 500,
      Uid: '2802e876-cc4b-42cf-958f-559963820fae',
      Value: 'Role'
    },
    CHILDROLES: [
      {
        Id: omadaAADGroup.Id,
        Uid: omadaAADGroup.UId,
        Keyvalue: null,
        KeyProperty: null,
        DisplayName: omadaAADGroup.DisplayName
      }
    ],
    ROLETYPEREF: {
      Id: 1002298,
      Uid: 'd9de1a22-1fd4-497c-ac9e-5f64bdefce4d',
      Keyvalue: null,
      KeyProperty: null,
      DisplayName: 'Application Role'
    },
    ROLEFOLDER: {
      Id: 1025283,
      Uid: '7bde3490-9fea-41f5-bf5f-0936f252b8e0',
      Keyvalue: null,
      KeyProperty: null,
      DisplayName: 'SharePoint Online Folder'
    },
    OWNERREF: [],
    ACCOUNTTYPE: [],
    EXPLICITOWNER: [],
    MANUALOWNER: [
      {
        Id: 1002923,
        Uid: '49c3e43e-4636-4564-88ce-17f73e113fdb',
        Keyvalue: null,
        KeyProperty: null,
        DisplayName: 'Anthony Baker'
      }
    ]
  }

  return new Promise((resolve, reject) => {
    httpntlm.post({
      url: 'http://enterpriseserver/OData/DataObjects/Resource',
      username: 'salesadm',
      password: 'Omadasales1!',
      domain: 'corporate',
      body: JSON.stringify(newResource),
      headers: {
        'Content-Type': 'application/json'
      }
    }, function (err, res) {
      if (err) {
        reject(err.message)
      }
      console.log(res.headers)
      console.log(res.body)
      resolve()
    })
  })
}

async function poll () {
  const queue = new Queue()
  const pendingGroup = queue.peek()
  if (!pendingGroup) {
    console.log('Nothing found on queue. Trying again in 15 seconds')
    setTimeout(() => {
      poll()
    }, 15000)
    return
  }
  const group = await getAADGroupFromOmada(pendingGroup.displayName)
  if (!group) {
    console.log('There is a pending group but it is not in Omada yet. Retrying in 15 seconds.')
    setTimeout(() => {
      poll()
    }, 15000)
  } else {
    await createSharePointResource(pendingGroup, group)
    queue.dequeue()
    console.log('Successfully created Omada Resource!')
    poll()
  }
}

function startPolling () {
  poll()
}

module.exports = {
  startPolling
}
