<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="68px">
      <el-form-item label="学校" prop="schoolId">
        <el-select v-model="query.schoolId" clearable filterable placeholder="全部学校" @change="schoolChanged">
          <el-option v-for="item in schools" :key="item.schoolId" :label="item.title || item.name" :value="item.schoolId" />
        </el-select>
      </el-form-item>
      <el-form-item label="活动" prop="instanceId">
        <el-select v-model="query.instanceId" clearable filterable placeholder="全部活动">
          <el-option v-for="item in activities" :key="item.instanceId" :label="item.title || item.name" :value="item.instanceId" />
        </el-select>
      </el-form-item>
      <el-form-item label="院系" prop="departmentId">
        <el-select v-model="query.departmentId" clearable filterable placeholder="全部院系">
          <el-option v-for="item in departments" :key="item.departmentId" :label="item.title || item.name" :value="item.departmentId" />
        </el-select>
      </el-form-item>
      <el-form-item label="专业" prop="major">
        <el-input v-model.trim="query.major" clearable placeholder="专业名称" @keyup.enter.native="search" />
      </el-form-item>
      <el-form-item label="学号" prop="studentNo">
        <el-input v-model.trim="query.studentNo" clearable placeholder="学号" @keyup.enter.native="search" />
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select v-model="query.gender" clearable placeholder="全部">
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
          <el-option label="其他/未填" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="角色" prop="roleId">
        <el-select v-model="query.roleId" clearable placeholder="全部角色">
          <el-option v-for="item in roles" :key="item.roleId" :label="item.roleName + '（' + item.jobTitle + '）'" :value="item.roleId" />
        </el-select>
      </el-form-item>
      <el-form-item label="结果" prop="result">
        <el-select v-model="query.result" clearable placeholder="全部结果">
          <el-option label="胜利" value="win" />
          <el-option label="失败" value="lose" />
          <el-option label="平局" value="draw" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="statusFilter">
        <el-select v-model="query.statusFilter" clearable placeholder="全部状态">
          <el-option label="通关" value="finished" />
          <el-option label="进行中" value="participating" />
        </el-select>
      </el-form-item>
      <el-form-item label="开始日期" prop="startDate">
        <el-date-picker v-model="query.startDate" type="date" value-format="yyyy-MM-dd" clearable placeholder="参与开始日期" style="width: 150px" />
      </el-form-item>
      <el-form-item label="结束日期" prop="endDate">
        <el-date-picker v-model="query.endDate" type="date" value-format="yyyy-MM-dd" clearable placeholder="参与结束日期" style="width: 150px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="search">查询</el-button>
        <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column type="index" :index="rowIndex" label="#" width="55" align="center" />
      <el-table-column prop="studentName" label="学生" width="100" align="center" />
      <el-table-column prop="studentNo" label="学号" width="125" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="140" show-overflow-tooltip />
      <el-table-column prop="departmentName" label="院系" min-width="140" show-overflow-tooltip />
      <el-table-column prop="major" label="专业" min-width="120" show-overflow-tooltip />
      <el-table-column prop="gender" label="性别" width="70" align="center" />
      <el-table-column prop="instanceName" label="活动" min-width="150" show-overflow-tooltip />
      <el-table-column label="所选角色" width="130" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.roleName">{{ scope.row.roleName }}</span>
          <span v-else class="muted">未选择</span>
        </template>
      </el-table-column>
      <el-table-column prop="jobTitle" label="职场定位" min-width="150" show-overflow-tooltip />
      <el-table-column label="结果" width="80" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.result === 'win'" type="success">胜利</el-tag>
          <el-tag v-else-if="scope.row.result === 'lose'" type="danger">失败</el-tag>
          <el-tag v-else-if="scope.row.result === 'draw'" type="warning">平局</el-tag>
          <el-tag v-else type="info">进行中</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="attemptNo" label="尝试" width="70" align="center" />
      <el-table-column prop="moveCount" label="步数" width="70" align="center" />
      <el-table-column label="参与时间" width="155" align="center">
        <template slot-scope="scope">{{ formatTime(scope.row.scanTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openDetail(scope.row)">查看</el-button>
          <el-button v-hasPermi="['zyjdc:record:remove']" type="text" size="small" class="danger-text" @click="remove(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="load" />

    <el-dialog title="参与记录详情" :visible.sync="detailVisible" width="720px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="学生">{{ detail.studentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ detail.studentNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学校">{{ detail.schoolName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="活动">{{ detail.instanceName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="院系">{{ detail.departmentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ detail.major || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detail.gender || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所选角色">{{ detail.roleName || '未选择' }}</el-descriptions-item>
        <el-descriptions-item label="职场定位">{{ detail.jobTitle || '-' }}</el-descriptions-item>
        <el-descriptions-item label="对局结果">{{ detail.resultName || '未结束' }}</el-descriptions-item>
        <el-descriptions-item label="结束原因">{{ reasonText(detail.resultReason) }}</el-descriptions-item>
        <el-descriptions-item label="尝试次数">{{ detail.attemptNo || 1 }}</el-descriptions-item>
        <el-descriptions-item label="落子步数">{{ detail.moveCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="参与时间">{{ formatTime(detail.scanTime) }}</el-descriptions-item>
        <el-descriptions-item label="开局时间">{{ formatTime(detail.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatTime(detail.finishTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { listRecords, deleteRecord, listRoles, zyjdcErrorMessage } from '@/api/zyjdc'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'ZyjdcRecords',
  data() {
    return {
      loading: false,
      total: 0,
      rows: [],
      schools: [],
      departments: [],
      activities: [],
      roles: [],
      detailVisible: false,
      detail: null,
      query: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        roleId: null,
        result: null,
        statusFilter: null,
        startDate: null,
        endDate: null
      }
    }
  },
  created() {
    this.loadOptions()
    this.load()
  },
  methods: {
    loadOptions() {
      listSchool({ pageNum: 1, pageSize: 1000 })
        .then(res => {
          this.schools = res.rows || res.data || []
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
      listInstances({})
        .then(res => {
          this.activities = res.data || res.rows || []
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
      listRoles()
        .then(res => {
          this.roles = res.data || []
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
    },
    schoolChanged(schoolId) {
      this.query.departmentId = null
      this.departments = []
      if (!schoolId) return
      listDepartment({ schoolId, pageNum: 1, pageSize: 1000 })
        .then(res => {
          if (this.query.schoolId === schoolId) {
            this.departments = (res.rows || res.data || []).filter(item => Number(item.parentId || 0) === 0)
          }
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
    },
    load() {
      if (this.invalidDateRange()) return
      this.loading = true
      listRecords(this.query)
        .then(res => {
          this.rows = res.rows || []
          this.total = res.total || 0
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    search() {
      this.query.pageNum = 1
      this.load()
    },
    reset() {
      this.query = {
        pageNum: 1,
        pageSize: this.query.pageSize,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        roleId: null,
        result: null,
        statusFilter: null,
        startDate: null,
        endDate: null
      }
      this.departments = []
      this.load()
    },
    invalidDateRange() {
      if (this.query.startDate && this.query.endDate && this.query.startDate > this.query.endDate) {
        this.$modal.msgWarning('开始日期不能晚于结束日期')
        return true
      }
      return false
    },
    rowIndex(index) {
      return (this.query.pageNum - 1) * this.query.pageSize + index + 1
    },
    openDetail(row) {
      this.detail = row
      this.detailVisible = true
    },
    remove(row) {
      this.$modal
        .confirm('删除后该学生可重新扫码参与，同时会清理对应的活动游戏参与数据，是否继续？')
        .then(() => deleteRecord(row.recordId))
        .then(() => {
          this.$modal.msgSuccess('删除成功')
          if (this.rows.length === 1 && this.query.pageNum > 1) {
            this.query.pageNum -= 1
          }
          this.load()
        })
        .catch(error => {
          if (error !== 'cancel' && error !== 'close') this.$modal.msgError(zyjdcErrorMessage(error))
        })
    },
    reasonText(reason) {
      if (reason === 'capture_all') return '吃光对方'
      if (reason === 'timeout') return '时间到'
      if (reason === 'no_move') return '无子可动'
      return '-'
    },
    formatTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (isNaN(date.getTime())) return String(value)
      const pad = n => (n < 10 ? '0' + n : '' + n)
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
    }
  }
}
</script>

<style scoped>
.muted {
  color: #909399;
}
</style>
