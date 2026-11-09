<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="80px">
      <el-form-item label="学校" prop="schoolId">
        <el-select v-model="query.schoolId" clearable filterable placeholder="全部学校" @change="schoolChanged">
          <el-option
            v-for="item in schools"
            :key="item.schoolId"
            :label="item.title || item.name"
            :value="item.schoolId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="活动" prop="instanceId">
        <school-activity-select v-model="query.instanceId" :school-id="query.schoolId" />
      </el-form-item>
      <el-form-item label="院系" prop="departmentId">
        <el-select v-model="query.departmentId" clearable filterable placeholder="全部院系">
          <el-option
            v-for="item in departments"
            :key="item.departmentId"
            :label="item.name || item.title"
            :value="item.departmentId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="专业" prop="major">
        <el-input v-model.trim="query.major" clearable placeholder="请输入专业" @keyup.enter.native="search" />
      </el-form-item>
      <el-form-item label="学号" prop="studentNo">
        <el-input v-model.trim="query.studentNo" clearable placeholder="请输入学号" @keyup.enter.native="search" />
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select v-model="query.gender" clearable placeholder="全部">
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
          <el-option label="其他/未填" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="发展方向" prop="directionCode">
        <el-select v-model="query.directionCode" clearable placeholder="全部方向">
          <el-option
            v-for="item in directions"
            :key="item.directionCode"
            :label="item.name"
            :value="item.directionCode"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="statusFilter">
        <el-select v-model="query.statusFilter" clearable placeholder="全部状态">
          <el-option label="进行中" value="inProgress" />
          <el-option label="已完成" value="finished" />
        </el-select>
      </el-form-item>
      <el-form-item label="参与日期">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="search">查询</el-button>
        <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="records" border stripe>
      <el-table-column prop="recordId" label="记录 ID" width="90" align="center" />
      <el-table-column prop="studentName" label="学生姓名" width="110" align="center" />
      <el-table-column prop="studentNo" label="学号" width="130" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="150" align="center" />
      <el-table-column prop="departmentName" label="院系" min-width="140" align="center" />
      <el-table-column prop="major" label="专业" min-width="120" align="center" />
      <el-table-column prop="gender" label="性别" width="70" align="center" />
      <el-table-column prop="instanceName" label="活动" min-width="170" align="center" />
      <el-table-column label="发展方向" min-width="130" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.directionName">{{ scope.row.directionName }}</span>
          <span v-else class="muted">未选择</span>
        </template>
      </el-table-column>
      <el-table-column prop="tagName" label="标签称号" min-width="120" align="center">
        <template slot-scope="scope">{{ scope.row.tagName || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === 'finished'" type="success">已完成</el-tag>
          <el-tag v-else type="info">进行中</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="选择用时" width="100" align="center">
        <template slot-scope="scope">{{ seconds(scope.row.durationMs) }}</template>
      </el-table-column>
      <el-table-column label="参与时间" width="160" align="center">
        <template slot-scope="scope">{{ formatDateTime(scope.row.scanTime) }}</template>
      </el-table-column>
      <el-table-column label="确认时间" width="160" align="center">
        <template slot-scope="scope">{{ formatDateTime(scope.row.finishTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="detail(scope.row)">详情</el-button>
          <el-button type="text" size="small" class="danger-text" @click="remove(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="query.pageNum"
      :limit.sync="query.pageSize"
      @pagination="load"
    />
    <el-empty v-if="!loading && !records.length" description="暂无符合条件的参与记录" />

    <el-dialog title="未来选择卡详情" :visible.sync="detailVisible" width="720px">
      <template v-if="detailRecord">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="学生">{{ detailRecord.studentName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ detailRecord.studentNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学校">{{ detailRecord.schoolName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="院系">{{ detailRecord.departmentName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ detailRecord.major || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ detailRecord.gender || '-' }}</el-descriptions-item>
          <el-descriptions-item label="参与时间">{{ formatDateTime(detailRecord.scanTime) }}</el-descriptions-item>
          <el-descriptions-item label="确认时间">{{ formatDateTime(detailRecord.finishTime) }}</el-descriptions-item>
          <el-descriptions-item label="用时">{{ seconds(detailRecord.durationMs) }}</el-descriptions-item>
        </el-descriptions>
        <template v-if="direction">
          <div class="detail-title">未来发展方向</div>
          <div class="direction-head">
            <span class="direction-name">{{ direction.name }}</span>
            <el-tag v-if="direction.tagName" type="warning">{{ direction.tagName }}</el-tag>
          </div>
          <div class="detail-title">方向解读</div>
          <div class="direction-text">{{ direction.interpretation || '暂无方向解读' }}</div>
          <div class="detail-title">寄语</div>
          <div class="direction-text">{{ direction.message || '暂无寄语' }}</div>
        </template>
        <el-empty v-else description="学生尚未确认未来发展方向" :image-size="60" />
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { listRecords, getRecord, deleteRecord, getConfig, zmwlErrorMessage } from '@/api/zmwl'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'ZmwlRecords',
  data() {
    return {
      loading: false,
      records: [],
      total: 0,
      schools: [],
      departments: [],
      directions: [],
      activities: [],
      dateRange: null,
      detailVisible: false,
      detailRecord: null,
      direction: null,
      query: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        directionCode: null,
        statusFilter: null,
      },
    }
  },
  created() {
    this.loadOptions()
    this.load()
  },
  methods: {
    loadOptions() {
      listSchool({ pageNum: 1, pageSize: 1000 })
        .then((res) => {
          this.schools = res.rows || res.data || []
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
      listInstances({})
        .then((res) => {
          // 活动数据由 SchoolActivitySelect 按学校加载，这里仅用于提前缓存。
          this.activities = res.data || res.rows || []
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
      getConfig()
        .then((res) => {
          this.directions = (res.data && res.data.directions) || []
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
    },
    schoolChanged(schoolId) {
      this.query.departmentId = null
      this.departments = []
      if (!schoolId) return
      listDepartment({ schoolId, pageNum: 1, pageSize: 1000 })
        .then((res) => {
          if (this.query.schoolId === schoolId) {
            this.departments = res.rows || res.data || []
          }
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
    },
    load() {
      this.loading = true
      const params = { ...this.query }
      if (this.dateRange && this.dateRange.length === 2) {
        params.startDate = this.dateRange[0]
        params.endDate = this.dateRange[1]
      }
      listRecords(params)
        .then((res) => {
          this.records = res.rows || res.data || []
          this.total = Number(res.total != null ? res.total : this.records.length)
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    detail(row) {
      getRecord(row.recordId)
        .then((res) => {
          const data = res.data || {}
          this.detailRecord = data.record || null
          this.direction = data.direction || null
          this.detailVisible = true
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
    },
    remove(row) {
      this.$modal
        .confirm('确认删除该条参与记录吗？将同时删除对应活动游戏参与数据，删除后可重新扫码参与，便于测试。')
        .then(() => deleteRecord(row.recordId))
        .then(() => {
          this.$modal.msgSuccess('记录已删除')
          if (this.records.length === 1 && this.query.pageNum > 1) {
            this.query.pageNum -= 1
          }
          this.load()
        })
        .catch((error) => {
          if (error) this.$modal.msgError(zmwlErrorMessage(error))
        })
    },
    search() {
      this.query.pageNum = 1
      this.load()
    },
    reset() {
      this.$refs.queryForm.resetFields()
      this.dateRange = null
      this.departments = []
      this.search()
    },
    seconds(value) {
      if (value == null || value === '') return '-'
      return `${(Number(value) / 1000).toFixed(1)} 秒`
    },
    formatDateTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      const pad = (n) => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
        date.getHours()
      )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },
  },
}
</script>

<style scoped>
.danger-text {
  color: #f56c6c;
}
.muted {
  color: #909399;
}
.detail-title {
  margin: 18px 0 10px;
  font-weight: 600;
}
.direction-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.direction-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}
.direction-text {
  padding: 10px 14px;
  background: #f7f8fa;
  border-radius: 4px;
  color: #303133;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}
/deep/ .el-table th {
  background: #f5f7fa;
}
</style>
