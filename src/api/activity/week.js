import request from '@/utils/request'

export function listGameTypes() {
  return request({
    url: '/activity/week/gameTypes',
    method: 'get'
  })
}

export function listDefinitions() {
  return request({
    url: '/activity/week/definitions',
    method: 'get'
  })
}

export function saveDefinition(data) {
  return request({
    url: '/activity/week/definition',
    method: 'post',
    data
  })
}

export function listInstances(params) {
  return request({
    url: '/activity/week/instances',
    method: 'get',
    params
  })
}

export function getInstance(instanceId) {
  return request({
    url: '/activity/week/instance/' + instanceId,
    method: 'get'
  })
}

export function saveInstance(data) {
  return request({
    url: '/activity/week/instance',
    method: 'post',
    data
  })
}

export function delInstance(instanceId) {
  return request({
    url: '/activity/week/instance/' + instanceId,
    method: 'delete'
  })
}

export function listInstanceSchools(instanceId) {
  return request({
    url: '/activity/week/instance/' + instanceId + '/schools',
    method: 'get'
  })
}

export function saveInstanceSchools(instanceId, schoolIds) {
  return request({
    url: '/activity/week/instance/' + instanceId + '/schools',
    method: 'post',
    data: schoolIds
  })
}

export function listAreas(params) {
  return request({
    url: '/activity/week/areas',
    method: 'get',
    params
  })
}

export function saveArea(data) {
  return request({
    url: '/activity/week/area',
    method: 'post',
    data
  })
}

export function delArea(areaId) {
  return request({
    url: '/activity/week/area/' + areaId,
    method: 'delete'
  })
}

export function listGames(areaId) {
  return request({
    url: '/activity/week/games',
    method: 'get',
    params: { areaId }
  })
}

export function getGame(gameId) {
  return request({
    url: '/activity/week/game/' + gameId,
    method: 'get'
  })
}

export function getGameView(gameId) {
  return request({
    url: '/activity/week/game/' + gameId + '/view',
    method: 'get'
  })
}

export function exportGameView(gameId) {
  return request({
    url: '/activity/week/game/' + gameId + '/view/export',
    method: 'get',
    responseType: 'blob'
  })
}

export function saveGame(data) {
  return request({
    url: '/activity/week/game',
    method: 'post',
    data
  })
}

export function delGame(gameId) {
  return request({
    url: '/activity/week/game/' + gameId,
    method: 'delete'
  })
}

export function regenerateGameQrCode(gameId) {
  return request({
    url: '/activity/week/game/qrcode/regenerate/' + gameId,
    method: 'post'
  })
}

export function listGameConfigs(gameType, status) {
  return request({
    url: '/activity/week/gameConfigs',
    method: 'get',
    params: { gameType, status }
  })
}

export function saveGameConfig(data) {
  return request({
    url: '/activity/week/gameConfig',
    method: 'post',
    data
  })
}

export function delGameConfig(configId) {
  return request({
    url: '/activity/week/gameConfig/' + configId,
    method: 'delete'
  })
}
