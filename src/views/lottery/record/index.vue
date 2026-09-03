<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="姓名" prop="nickName">
        <el-input
          v-model="queryParams.nickName"
          placeholder="请输入姓名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>

      <el-form-item label="所属抽奖活动" prop="activityTitle">
        <el-input
          v-model="queryParams.activityTitle"
          placeholder="请输入所属抽奖活动"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>

      <el-form-item label="活动类型" prop="bizType">
        <el-select v-model="queryParams.bizType" clearable placeholder="请选择活动类型" size="small">
          <el-option label="生涯活动" value="career_week" />
          <el-option label="就业活动" value="job_week" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['lottery:record:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['lottery:record:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="recordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="recordId" />
      <el-table-column label="账号" align="center" prop="userName" />
      <el-table-column label="姓名" align="center" prop="nickName" />
      <el-table-column label="所属抽奖活动" align="center" prop="activityTitle" />
      <el-table-column label="活动类型" align="center" prop="bizType">
        <template slot-scope="scope">
          <span>{{ scope.row.bizType === 'job_week' ? '就业活动' : '生涯活动' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="奖品名称" align="center" prop="prizeTitle" />
      <el-table-column label="文本核销码" align="center" prop="redemptionCode" />
      <el-table-column label="展示名称" align="center" prop="resultName" />
      <el-table-column label="抽奖时间" align="center" prop="createTime" width="180" />
      <el-table-column label="核销状态" align="center" prop="redemptionStatus"><template slot-scope="scope"><el-tag :type="scope.row.redemptionStatus==='1'?'success':'warning'">{{ scope.row.redemptionStatus==='1'?'已核销':'待核销' }}</el-tag></template></el-table-column>
      <el-table-column label="核销时间" align="center" prop="redeemTime" width="180" />
      <el-table-column label="核销操作人" align="center" min-width="150">
        <template slot-scope="scope">
          <template v-if="scope.row.redemptionStatus === '1'">
            <div>{{ scope.row.redemptionStaffName || '未知操作人' }}</div>
            <div v-if="scope.row.redemptionStaffAccount" class="operator-account">账号：{{ scope.row.redemptionStaffAccount }}</div>
            <el-tag size="mini" :type="scope.row.redemptionOperatorType === 'STAFF' ? 'success' : 'primary'">
              {{ scope.row.redemptionOperatorType === 'STAFF' ? '学校工作人员' : '后台管理员' }}
            </el-tag>
          </template>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['lottery:record:remove']"
          >删除</el-button>
          <el-button size="mini" type="text" icon="el-icon-document" @click="showRedemptionLogs(scope.row)">核销流水</el-button>
          <el-button size="mini" type="text" icon="el-icon-picture" @click="showQrCode(scope.row)">查看核销码</el-button>
          <el-button v-if="scope.row.redemptionStatus !== '1' && scope.row.prizeTitle !== '谢谢参与'" size="mini" type="text" icon="el-icon-check" @click="redeem(scope.row)">核销</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改抽奖记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="抽奖用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入抽奖用户ID" />
        </el-form-item>
        <el-form-item label="活动ID" prop="activityId">
          <el-input v-model="form.activityId" placeholder="请输入活动ID" />
        </el-form-item>
        <el-form-item label="抽中的奖品ID" prop="prizeId">
          <el-input v-model="form.prizeId" placeholder="请输入抽中的奖品ID" />
        </el-form-item>
        <el-form-item label="展示名称" prop="resultName">
          <el-input v-model="form.resultName" placeholder="请输入展示名称" />
        </el-form-item>
        <el-form-item label="抽奖时间" prop="createdAt">
          <el-date-picker clearable
            v-model="form.createdAt"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择抽奖时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="抽奖ip" prop="ip">
          <el-input v-model="form.ip" placeholder="请输入抽奖ip" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
    <el-dialog title="奖品核销流水" :visible.sync="logVisible" width="960px" append-to-body>
      <el-descriptions v-if="logRecord.recordId" :column="3" border size="small" class="log-summary">
        <el-descriptions-item label="中奖记录">#{{ logRecord.recordId }}</el-descriptions-item>
        <el-descriptions-item label="中奖用户">{{ logRecord.nickName || logRecord.userName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="奖品">{{ logRecord.prizeTitle || '—' }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-loading="logLoading" :data="redemptionLogs" empty-text="暂无核销操作流水" border>
        <el-table-column label="操作人" min-width="170">
          <template slot-scope="scope">
            <div class="operator-name">{{ scope.row.operatorName || '系统' }}</div>
            <div v-if="scope.row.operatorAccount" class="operator-account">账号：{{ scope.row.operatorAccount }}</div>
          </template>
        </el-table-column>
        <el-table-column label="身份" align="center" width="110">
          <template slot-scope="scope">
            <el-tag size="mini" :type="operatorTagType(scope.row.operatorType)">{{ operatorTypeText(scope.row.operatorType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="110">
          <template slot-scope="scope">{{ actionText(scope.row.action) }}</template>
        </el-table-column>
        <el-table-column label="状态变化" align="center" width="150">
          <template slot-scope="scope">
            <span>{{ statusText(scope.row.beforeStatus) }}</span>
            <i class="el-icon-right status-arrow" />
            <span>{{ statusText(scope.row.afterStatus) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createTime" label="操作时间" align="center" width="180" />
      </el-table>
    </el-dialog>
    <el-dialog title="奖品核销码" :visible.sync="qrVisible" width="460px" append-to-body center>
      <div style="text-align:center"><img :src="qrUrl" style="width:360px;height:360px" /></div>
    </el-dialog>
  </div>
</template>

<script>
import { listRecord, getRecord, delRecord, addRecord, updateRecord, getRedemptionLogs, redeemRecord } from "@/api/lottery/record"

export default {
  name: "Record",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 抽奖记录表格数据
      recordList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userName: null,
        nickName: null,
        activityTitle: null,
        bizType: null,
        prizeTitle: null,
        resultName: null,
        createdAt: null,
        ip: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      },
      logVisible: false,
      logLoading: false,
      logRecord: {},
      redemptionLogs: []
      ,qrVisible: false
      ,qrUrl: ''
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询抽奖记录列表 */
    getList() {
      this.loading = true
      listRecord(this.queryParams).then(response => {
        this.recordList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    showRedemptionLogs(row) {
      this.logRecord = row || {}
      this.redemptionLogs = []
      this.logVisible = true
      this.logLoading = true
      getRedemptionLogs(row.recordId).then(response => {
        this.redemptionLogs = response.data || []
      }).finally(() => {
        this.logLoading = false
      })
    },
    actionText(action) {
      return ({ SCAN: '扫码查看', REDEEM: '工作人员核销', ADMIN_REDEEM: '后台核销', REPEAT: '重复核销', REVOKE: '撤销核销' })[action] || action || '未知操作'
    },
    statusText(status) {
      return ({ '0': '待核销', '1': '已核销', '2': '已撤销', '3': '已过期' })[String(status)] || '—'
    },
    operatorTypeText(type) {
      return ({ STAFF: '学校工作人员', ADMIN: '后台管理员', SYSTEM: '系统' })[type] || '系统'
    },
    operatorTagType(type) {
      return type === 'STAFF' ? 'success' : (type === 'ADMIN' ? 'primary' : 'info')
    },
    redeem(row) {
      this.$modal.confirm('确认核销该奖品吗？').then(() => redeemRecord(row.recordId)).then(() => {
        this.$modal.msgSuccess('核销成功')
        this.getList()
      })
    },
    showQrCode(row) {
      if (!row || !row.recordId || row.prizeTitle === '谢谢参与') return
      this.qrUrl = process.env.VUE_APP_BASE_API + '/profile/lottery/qr/' + row.recordId + '.png'
      this.qrVisible = true
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        recordId: null,
        userId: null,
        activityId: null,
        prizeId: null,
        resultName: null,
        createdAt: null,
        ip: null
      }
      this.resetForm("form")
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.recordId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加抽奖记录"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const recordId = row.recordId || this.ids
      getRecord(recordId).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改抽奖记录"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.recordId != null) {
            updateRecord(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addRecord(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const recordIds = row.recordId || this.ids
      this.$modal.confirm('是否确认删除抽奖记录编号为"' + recordIds + '"的数据项？').then(function() {
        return delRecord(recordIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('lottery/record/export', {
        ...this.queryParams
      }, `record_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>

<style scoped>
.operator-name {
  color: #303133;
  font-weight: 500;
}

.operator-account {
  margin: 3px 0;
  color: #909399;
  font-size: 12px;
}

.text-muted {
  color: #c0c4cc;
}

.log-summary {
  margin-bottom: 16px;
}

.status-arrow {
  margin: 0 7px;
  color: #909399;
}
</style>
