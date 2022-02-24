require('isomorphic-fetch')
const graph = require('@microsoft/microsoft-graph-client')

/**
 * Creates a security group in AAD
 * @param {String} displayName
 */
async function createGroup (displayName) {
  const clientOptions = {
    authProvider: new ClientCredentialsAuthProvider()
  }
  const client = graph.Client.initWithMiddleware(clientOptions)

  const group = await client.api('groups').post({
    securityEnabled: true,
    mailEnabled: false,
    mailNickname: displayName,
    groupTypes: [],
    displayName
  })

  return group
}

class ClientCredentialsAuthProvider {
  /**
     * @returns {Promise<String>}
     */
  async getAccessToken () {
    if (this.access_token && this.expiresDate > Date.now() / 1000) {
      return this.access_token
    }
    const params = new URLSearchParams()
    params.set('client_id', '2debd8b5-50d1-45f7-94c1-dbbe13644a54')
    params.set('client_secret', process.env.CLIENT_SECRET)
    params.set('grant_type', 'client_credentials')
    params.set('scope', 'https://graph.microsoft.com/.default')
    const response = await global.fetch(
      'https://login.microsoftonline.com/87bb759d-b1e2-456d-a24c-0ccb8237f1d2/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: {
          'Content-Typ': 'application/x-www-form-urlencoded'
        },
        body: params
      }
    )
    const tokens = await response.json()
    const now = Date.now() / 1000 // now in seconds
    this.expiresDate = now + tokens.expires_in
    this.access_token = tokens.access_token
    return this.access_token
  }
}

module.exports = {
  createGroup
}
