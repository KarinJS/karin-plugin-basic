import { Update } from '#Karin'

export default async function (fastify, options) {
  fastify.get('/checkUpdate', async (request, reply) => {
    const plugins = Update.getPlugins()
    let updatePlugins = []
    for (const plugin of plugins) {
      const path = `${process.cwd()}/plugins/${plugin}`
      try {
        const { data, count = 0 } = await Update.checkUpdate(path)
        if (data) {
          updatePlugins.push(plugin)
        }
      } catch (error) {}
    }

    return reply.send({
      status: 'success',
      data: updatePlugins
    })
  })

  fastify.post('/update', async (request, reply) => {
    const { force } = request.body
    const msg = []
    let list = Update.getPlugins()
    let cmd = force ? 'git reset --hard && git pull --allow-unrelated-histories' : 'git pull'
    try {
      const { data } = await Update.update(process.cwd(), cmd)
      msg.push(`Karin：${data}`)
    } catch (error) {
      msg.push(`Karin：${error.message}`)
    }
    const promises = list.map(async name => {
      /** 拼接路径 */
      const item = process.cwd() + `/plugins/${name}`
      try {
        const { data } = await Update.update(item, cmd)
        msg.push(`${name}：${data}`)
      } catch (error) {
        msg.push(`${name}：${error.message}`)
      }
    })
    await Promise.all(promises)
    reply.send({
      status: 'success',
      data: msg
    })
  })
}
