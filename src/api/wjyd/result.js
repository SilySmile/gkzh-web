import request from '@/utils/request'

// 查询答题结果列表
export function listResult(query) {
    return request({
        url: '/answer/result/list',
        method: 'get',
        params: query
    })
}

// 导出答题结果
export function exportResult(query) {
    return request({
        url: '/answer/result/exportUserAnswerRecords',
        method: 'get',
        params: query
    })
}

// 获取答题详情
export function getResultDetails(roundId) {
    return request({
        url: '/answer/result/detail/' + roundId,
        method: 'get'
    })
}
