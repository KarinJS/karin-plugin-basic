import { redis } from '#Karin'
import moment from 'moment'

async function getStatsList (key) {
  const statsList = []
  /** 对于30天的统计，预先生成所有可能的键 */
  const keys = Array.from({ length: 30 }, (_, i) => {
    const date = moment().subtract(i, 'days').format('YYYY-MM-DD')
    return { key: `${key}:${date}`, date }
  })

  for (const { key: k, date } of keys) {
    const value = Number(await redis.get(k)) || 0
    statsList.push({ date, value })
  }

  return statsList
}

export default async function (fastify, options) {
  fastify.get('/GetKarinStatusCount', async (request, reply) => {
    const recv_key = 'karin:count:recv'
    const send_key = 'karin:count:send'
    const fnc_key = 'karin:count:fnc'
    const time = moment().format('YYYY-MM-DD')
    const recv_count = recv_key + `:${time}`
    const send_count = send_key + `:${time}`
    const fnc_count = fnc_key + `:${time}`

    // 今日统计
    const day_send_count = await redis.get(send_count) || 0
    const day_fnc_count = await redis.get(fnc_count) || 0
    const day_recv_count = await redis.get(recv_count) || 0
    // 本月统计
    const month_send_count = await getStatsList(send_key)
    const month_fnc_count = await getStatsList(fnc_key)
    const month_recv_count = await getStatsList(recv_key)
    return reply.send({
      status: 'success',
      data: {
        day_send_count,
        day_fnc_count,
        day_recv_count,
        month_send_count,
        month_fnc_count,
        month_recv_count
      }
    })
  })
}
