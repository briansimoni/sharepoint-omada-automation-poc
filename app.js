const azure = require('./azure')
const sharepoint = require('./sharepoint')
const Koa = require('koa')
const Router = require('@koa/router')
const serve = require('koa-static')
const mount = require('koa-mount')
const views = require('koa-views')
const path = require('path')
const session = require('koa-session')
const bodyParser = require('koa-bodyparser')
const { Queue } = require('./queue')
const { startPolling } = require('./consumer')
require('dotenv').config()

const sessionConfig = {
  key: 'service-meow-session',
  maxAge: 3600000
}

const app = new Koa()
app.keys = ['thisissosecret']
app.use(session(sessionConfig, app))
app.use(bodyParser())

const staticFiles = serve(path.join(__dirname, 'static'))
app.use(mount('/static', staticFiles))

// request logging middleware
app.use((ctx, next) => {
  const start = new Date().getTime()
  ctx.res.on('finish', () => {
    console.log(JSON.stringify({
      responseTime: new Date().getTime() - start,
      statusCode: ctx.res.statusCode,
      method: ctx.request.method,
      path: ctx._matchedRoute || ctx.path,
      remoteAddress: ctx.ip,
      userAgent: ctx.request.headers['user-agent']
    }, null, 2))
  })
  return next()
})

const router = new Router()

const render = views(path.join(__dirname, 'views'), {
  map: {
    html: 'handlebars'
  },
  options: {
    partials: {
      footer: 'footer',
      header: 'header',
      sidebar: 'sidebar'
    }
  }
})

app.use(render)

// 404 middleware
app.use(async (ctx, next) => {
  try {
    await next()
    const status = ctx.status || 404
    if (status === 404) {
      ctx.throw(404)
    }
  } catch (err) {
    ctx.status = err.status || 500
    if (ctx.status === 404) {
      await ctx.render('404', { user: ctx.session.user })
    } else {
      await ctx.render('error', { status: ctx.status, error: err })
    }
  }
})

router.get('/', async ctx => {
  await ctx.render('index')
})

router.get('/new-site-request', async ctx => {
  await ctx.render('new-site-request')
})

router.post('/new-site-request', async (ctx) => {
  const siteName = ctx.request.body.siteName

  // const site = await sharepoint.createSite(siteName)
  // const groups = await sharepoint.getGroups(`https://stereodose.sharepoint.com/sites/${siteName}`)

  // const membersSpGroup = groups.find(g => g.LoginName.includes('Members'))
  // const visitorsSpGroup = groups.find(g => g.LoginName.includes('Visitors'))

  // const membersGroup = await azure.createGroup(`${siteName}-members`)
  // const visitorsGroup = await azure.createGroup(`${siteName}-visitors`)

  // await sharepoint.addSecurityGroupToSiteGroup(`https://stereodose.sharepoint.com/sites/${siteName}`, membersGroup, membersSpGroup.LoginName)
  // await sharepoint.addSecurityGroupToSiteGroup(`https://stereodose.sharepoint.com/sites/${siteName}`, visitorsGroup, visitorsSpGroup.LoginName)

  // const queue = new Queue()
  // queue.enqueue(membersGroup)
  // queue.enqueue(visitorsGroup)

  await ctx.render('new-site-request', {
    createdSite: siteName
  })
})

app.use(router.routes())
app.use(router.allowedMethods())

app.on('error', async (error, ctx) => {
  console.log(error)
})

async function main () {
  startPolling()
  console.log('server is starting up')
  const port = process.env.PORT || 9000
  const server = app.listen(port, '0.0.0.0', async () => {
    console.log('listening on', port)
  })

  process.on('SIGINT', () => {
    console.info('SIGINT signal received. Server shutting down')
    setTimeout(() => {
      server.close((err) => {
        if (err) {
          console.error(err.message)
          process.exit(1)
        }
        console.log('server shut down gracefully')
        process.exit(0)
      })
      console.error('timeout reached. exit code 1')
      process.exit(1)
    }, 1000)
  })

  process.on('SIGTERM', () => {
    console.info('SIGTERM signal received. Server shutting down')
    setTimeout(() => {
      server.close((err) => {
        if (err) {
          console.error(err.message)
          process.exit(1)
        }
        console.log('server shut down gracefully')
        process.exit(0)
      })
      console.error('timeout reached. exit code 1')
      process.exit(1)
    }, 1000)
  })
}
main()
