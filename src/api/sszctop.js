// 谁是职场TOP后台接口：配置查询、保存以及房间日志查询。
import request from '@/utils/request'

export const listDimensions = params => request({ url: '/sszctop/config/dimensions', method: 'get', params })
export const saveDimension = (data, isNew) => request({ url: '/sszctop/config/dimensions', method: isNew ? 'post' : 'put', data })
// 删除指定维度；后端会校验关联排序数据和当前用户权限。
export const deleteDimension = id => request({ url: `/sszctop/config/dimensions/${id}`, method: 'delete' })
export const listCareers = params => request({ url: '/sszctop/config/careers', method: 'get', params })
export const saveCareer = (data, isNew) => request({ url: '/sszctop/config/careers', method: isNew ? 'post' : 'put', data })
// 删除指定职业；后端会校验关联排序数据和当前用户权限。
export const deleteCareer = id => request({ url: `/sszctop/config/careers/${id}`, method: 'delete' })
export const listRanks = params => request({ url: '/sszctop/config/ranks', method: 'get', params })
export const saveRank = (data, isNew) => request({ url: '/sszctop/config/ranks', method: isNew ? 'post' : 'put', data })
// 删除指定维度排序文案，不会影响其他维度或职业配置。
export const deleteRank = id => request({ url: `/sszctop/config/ranks/${id}`, method: 'delete' })
export const listRoomLogs = params => request({ url: '/sszctop/config/room-logs', method: 'get', params })
// 查询一个房间内的完整事件明细，列表页仅展示房间汇总信息。
export const getRoomLogDetails = roomId => request({ url: `/sszctop/config/room-logs/${roomId}`, method: 'get' })
// 通过日志中的用户和游戏定位，清除该用户本游戏的测试报告及参与记录。
export const clearTestRecord = logId => request({ url: `/sszctop/config/room-logs/${logId}/test-record`, method: 'delete' })
// 批量清理时服务端按游戏和用户集合执行 IN 条件删除，避免逐条请求。
export const clearTestRecords = logIds => request({ url: '/sszctop/config/room-logs/test-records', method: 'delete', data: { logIds } })
