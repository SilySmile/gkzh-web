<template>
  <div class="app-container">
    <el-row :gutter="16">
      <el-col :span="7">
        <el-card>
          <div slot="header">
            <span>活动配置</span>
          </div>
          <el-select v-model="selectedSchoolId" placeholder="请先选择学校" style="width: 100%; margin-bottom: 10px" @change="loadInstances">
            <el-option v-for="school in schoolList" :key="school.schoolId" :label="school.title" :value="school.schoolId" />
          </el-select>

          <el-select v-model="selectedBizType" placeholder="选择活动" style="width: 100%" :disabled="!selectedSchoolId" @change="loadInstances">
            <el-option
              v-for="item in definitions"
              :key="item.bizType"
              :label="item.name"
              :value="item.bizType"
            />
          </el-select>

          <div class="instance-list">
            <div
              v-for="item in instances"
              :key="item.instanceId"
              class="instance-item"
              :class="{ active: item.instanceId === selectedInstanceId }"
              @click="selectInstance(item)"
            >
              <div class="instance-main">
                <div>{{ item.title }}</div>
                <div class="instance-time">{{ item.startTime }} ~ {{ item.endTime }}</div>
                <div class="instance-actions">
                  <el-button v-if="item.status !== '2'" type="text" size="mini" @click.stop="editInstance(item)">编辑</el-button>
                  <el-button type="text" size="mini" style="color:#f56c6c" :loading="deletingInstanceId === item.instanceId" :disabled="!selectedSchoolId || deletingInstanceId !== null" @click.stop="removeInstance(item)">删除本校活动</el-button>
                </div>
              </div>
              <div class="instance-switch">
                <el-switch
                  :value="item.status === '1'"
                  :disabled="item.status === '0' || item.status === '2'"
                  active-color="#13ce66"
                  inactive-color="#c0c4cc"
                  @change="(val) => toggleInstanceStatus(item, val)"
                  @click.stop
                />
              </div>
              <div class="instance-status">
                <el-tag size="mini" :type="instanceStatusType(item.status)">{{ instanceStatusName(item.status) }}</el-tag>
              </div>
            </div>
          </div>

          <el-button type="primary" size="mini" icon="el-icon-plus" :disabled="!selectedSchoolId" @click="openInstanceDialog()">新增实例</el-button>
          <el-button size="mini" icon="el-icon-connection" :disabled="!selectedSchoolId" @click="openAddExistingDialog">添加已有活动</el-button>
        </el-card>
      </el-col>

      <el-col :span="17">
        <el-card v-loading="loading">
          <div slot="header">
            <span>区域与游戏</span>
            <el-tag v-if="currentSchool" size="small" type="info" style="margin-left: 12px">{{ currentSchool.title }}</el-tag>
            <el-button size="mini" type="warning" :disabled="!selectedInstanceId || isEndedInstance()" @click="openSchoolConfigDialog">学校抽奖门槛</el-button>
            <el-button style="float: right" type="success" size="mini" icon="el-icon-plus" :disabled="!selectedInstanceId || isEndedInstance()" @click="openAreaDialog">新增区域</el-button>
          </div>

          <div v-for="area in areas" :key="area.areaId" class="area-card">
            <div class="area-head">
              <span>{{ area.title }} <el-tag v-if="schoolNameMap[area.schoolId]" size="mini">{{ schoolNameMap[area.schoolId] }}</el-tag></span>
              <span>
                <el-button type="text" size="mini" :disabled="isEndedInstance()" @click="openGameDialog(area)">新增游戏</el-button>
                <el-button type="text" size="mini" :disabled="isEndedInstance()" @click="removeArea(area)">删除</el-button>
              </span>
            </div>
            <el-table :data="gamesByArea[area.areaId] || []" border size="mini">
              <el-table-column label="游戏名称" prop="title" />
              <el-table-column label="类型" width="130">
                <template slot-scope="scope">{{ gameTypeName(scope.row.gameType) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="220">
                <template slot-scope="scope">
                  <el-button type="text" size="mini" @click="previewQr(scope.row)">二维码</el-button>
                  <el-button type="text" size="mini" @click="viewGame(scope.row)">查看</el-button>
                  <el-button type="text" size="mini" :disabled="isEndedInstance()" @click="removeGame(scope.row, area)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <el-empty v-if="!areas.length" description="暂无区域" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog :title="instanceDialogTitle" :visible.sync="instanceDialogVisible" width="480px">
      <el-form :model="instanceForm" label-width="90px">
        <el-form-item label="所属学校"><el-input :value="currentSchool ? currentSchool.title : null" disabled /></el-form-item>
        <el-form-item label="活动">
          <el-select v-model="instanceForm.bizType" style="width: 100%">
            <el-option v-for="item in definitions" :key="item.bizType" :label="item.name" :value="item.bizType" />
          </el-select>
        </el-form-item>
        <el-form-item label="实例名称"><el-input v-model="instanceForm.title" /></el-form-item>
        <el-form-item label="Banner图"><ImageUpload v-model="instanceForm.bannerUrl" :limit="1" /></el-form-item>
        <el-form-item label="开始时间"><el-date-picker v-model="instanceForm.startTime" type="date" value-format="yyyy-MM-dd" :picker-options="startDateOptions" style="width: 100%" /></el-form-item>
        <el-form-item label="结束时间"><el-date-picker v-model="instanceForm.endTime" type="date" value-format="yyyy-MM-dd" :picker-options="endDateOptions" :disabled="!instanceForm.startTime" style="width: 100%" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="instanceDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="instanceSaving" @click="submitInstance">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="添加已有活动到本校" :visible.sync="addExistingDialogVisible" width="560px">
      <el-alert type="info" :closable="false" show-icon
                :title="'将已有活动添加到：' + (currentSchool ? currentSchool.title : '')" />
      <el-form label-width="90px" style="margin-top: 16px">
        <el-form-item label="活动类型">
          <el-input :value="definitionName(selectedBizType)" disabled />
        </el-form-item>
        <el-form-item label="选择活动">
          <el-select v-model="addExistingInstanceId" filterable clearable
                     placeholder="请选择要添加的活动" style="width: 100%"
                     :loading="addExistingLoading">
            <el-option v-for="item in addExistingCandidates" :key="item.instanceId"
                       :label="instanceOptionLabel(item)" :value="item.instanceId" />
          </el-select>
          <div class="form-tip">只列出同活动类型、当前学校尚未添加的活动；添加后可在“区域与游戏”中为该校独立配置内容。</div>
        </el-form-item>
      </el-form>
      <el-empty v-if="!addExistingLoading && !addExistingCandidates.length"
                description="没有可添加的活动" :image-size="70" />
      <div slot="footer">
        <el-button @click="addExistingDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addExistingSaving" :disabled="!addExistingInstanceId"
                   @click="submitAddExisting">确定添加</el-button>
      </div>
    </el-dialog>

    <el-dialog title="学校抽奖门槛" :visible.sync="schoolConfigDialogVisible" width="780px">
      <el-table :data="currentSchool ? [currentSchool] : []" size="mini" border>
        <el-table-column label="学校" prop="title" />
        <el-table-column label="绑定抽奖" width="220">
          <template slot-scope="scope">
            <el-select v-model="schoolConfigForm[scope.row.schoolId].lotteryId" clearable placeholder="不选择则无抽奖" size="mini" style="width: 100%">
              <el-option v-for="lottery in lotteryOptionsForSchool(scope.row.schoolId)" :key="lottery.lotteryId" :label="lottery.title" :value="lottery.lotteryId" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="最低完成游戏数（0表示不限制）" width="220">
          <template slot-scope="scope">
            <el-input-number v-model="schoolConfigForm[scope.row.schoolId].minFinishCount" :min="0" size="mini" controls-position="right" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="最多抽奖次数" width="160">
          <template slot-scope="scope">
            <el-input-number v-model="schoolConfigForm[scope.row.schoolId].maxDrawCount" :min="1" size="mini" controls-position="right" style="width: 100%" />
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" style="display:flex; justify-content:space-between">
        <el-button @click="schoolConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSchoolConfig">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="areaDialogTitle" :visible.sync="areaDialogVisible" width="480px">
      <el-form :model="areaForm" label-width="90px">
        <el-form-item label="区域名称"><el-input v-model="areaForm.title" /></el-form-item>
        <el-form-item label="所属学校" required>
          <el-select v-model="areaForm.schoolId" disabled style="width: 100%">
            <el-option v-for="school in schoolList" :key="school.schoolId" :label="school.title" :value="school.schoolId" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示顺序"><el-input-number v-model="areaForm.sortOrder" :min="0" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="areaDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitArea">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="gameDialogTitle" :visible.sync="gameDialogVisible" width="480px">
      <el-form :model="gameForm" label-width="90px">
        <el-form-item label="游戏类型">
          <el-select v-model="gameForm.gameCategory" style="width: 100%" @change="handleGameTypeChange">
            <el-option v-for="item in gameTypes" :key="item.gameType" :label="gameTypeLabel(item)" :value="item.gameType" />
          </el-select>
        </el-form-item>
        <el-form-item label="游戏配置">
          <el-select v-model="gameForm.configId" style="width: 100%" @change="handleGameConfigChange">
            <el-option v-for="item in gameConfigs" :key="item.configId" :label="item.gameName" :value="item.configId" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示顺序"><el-input-number v-model="gameForm.sortOrder" :min="0" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="gameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGame">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="qrTitle" :visible.sync="qrDialogVisible" width="360px" append-to-body>
      <div style="text-align: center">
        <img :src="qrUrl" style="max-width: 280px" alt="游戏二维码" />
      </div>
      <div slot="footer" style="display:flex; justify-content:space-between; align-items:center; padding:0 20px">
        <a :href="qrUrl" download="game-qrcode.png" style="margin:0"><el-button size="small" type="success" style="margin:0">下载二维码</el-button></a>
        <el-button size="small" type="primary" @click="regenerateQr" style="margin:0">重新生成</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listDefinitions,
  listInstances,
  saveInstance,
  delInstance,
  addInstanceSchool,
  listInstanceSchools,
  saveInstanceSchools,
  listAreas,
  saveArea,
  delArea,
  listGames,
  saveGame,
  delGame,
  listGameTypes,
  listGameConfigs,
  regenerateGameQrCode
} from '@/api/activity/week'
import { listSchool } from '@/api/school/school'
import { listActivity } from '@/api/lottery/activity'

export default {
  name: 'ActivityWeek',
  data() {
    return {
      loading: false,
      definitions: [],
      gameTypes: [],
      gameConfigs: [],
      allGameConfigs: [],
      schoolList: [],
      schoolNameMap: {},
      selectedBizType: null,
      selectedInstanceId: null,
      selectedInstance: null,
      selectedSchoolId: null,
      instances: [],
      areas: [],
      gamesByArea: {},
      instanceDialogVisible: false,
      instanceDialogTitle: '',
      instanceForm: {},
      areaDialogVisible: false,
      areaDialogTitle: '',
      areaForm: {},
      gameDialogVisible: false,
      gameDialogTitle: '',
      gameForm: {},
      qrDialogVisible: false,
      qrTitle: '',
      qrUrl: '',
      currentGameId: null,
      hasActiveInstance: false,
      instanceSaving: false,
      deletingInstanceId: null,
      instanceRequestId: 0,
      areaRequestId: 0,
      addExistingDialogVisible: false,
      addExistingLoading: false,
      addExistingSaving: false,
      addExistingInstanceId: null,
      addExistingCandidates: [],
      schoolConfigDialogVisible: false,
      schoolConfigForm: {},
      lotteryOptions: []
    }
  },
  computed: {
    currentSchool() {
      return this.schoolList.find(school => school.schoolId === this.selectedSchoolId) || null
    },
    startDateOptions() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return {
        disabledDate: (time) => time.getTime() < today.getTime()
      }
    },
    endDateOptions() {
      const start = this.instanceForm.startTime
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const min = start ? new Date(start + 'T00:00:00').getTime() : today.getTime()
      return {
        disabledDate: (time) => time.getTime() < min
      }
    }
  },
  created() {
    this.loadDefinitions()
    this.loadGameTypes()
    this.loadAllGameConfigs()
    this.loadSchools()
  },
  methods: {
    loadDefinitions() {
      listDefinitions().then(res => {
        this.definitions = res.data || []
        if (this.definitions.length) {
          this.selectedBizType = this.definitions[0].bizType
          this.loadInstances()
        }
      })
    },
    loadGameTypes() {
      listGameTypes().then(res => {
        const allowed = ['choice', 'answer', 'cooperation']
        const source = res.data || []
        const seen = {}
        this.gameTypes = source.map(item => {
          if (allowed.indexOf(item.gameType) >= 0) return item
          const config = this.allGameConfigs.find(c => c.route === item.gameType || c.gameType === item.gameType)
          return config && config.category ? Object.assign({}, item, { gameType: config.category, gameName: config.category === 'choice' ? '选择' : (config.category === 'answer' ? '答题' : '合作') }) : item
        }).filter(item => allowed.indexOf(item.gameType) >= 0 && !seen[item.gameType] && (seen[item.gameType] = true))
      })
    },
    loadAllGameConfigs() {
      listGameConfigs().then(res => {
        this.allGameConfigs = res.data || []
      })
    },
    gameTypeName(gameType) {
      const config = this.allGameConfigs.find(item => item.route === gameType || item.gameType === gameType)
      if (config && config.gameName) return config.gameName
      const category = config ? config.category : gameType
      const item = this.gameTypes.find(type => type.gameType === category)
      if (item) return item.gameName
      const fallback = { choice: '选择类', answer: '答题类', cooperation: '合作类' }
      return fallback[category] || category
    },
    gameTypeLabel(item) {
      const labels = { choice: '选择', answer: '答题', cooperation: '合作' }
      return labels[item.gameType] || item.gameName || item.gameType
    },
    loadSchools() {
      listSchool({ pageSize: 1000 }).then(res => {
        this.schoolList = res.rows || []
        this.schoolNameMap = {}
        this.schoolList.forEach(school => {
          this.$set(this.schoolNameMap, school.schoolId, school.title)
        })
      })
    },
    loadInstances() {
      const requestId = ++this.instanceRequestId
      ++this.areaRequestId
      this.instances = []
      this.hasActiveInstance = false
      this.selectedInstanceId = null
      this.selectedInstance = null
      this.areas = []
      this.gamesByArea = {}
      this.loading = false
      this.schoolConfigDialogVisible = false
      this.areaDialogVisible = false
      this.gameDialogVisible = false
      if (!this.selectedBizType || !this.selectedSchoolId) return Promise.resolve()
      return listInstances({ bizType: this.selectedBizType, schoolId: this.selectedSchoolId }).then(res => {
        if (requestId !== this.instanceRequestId) return
        this.instances = res.data || []
        this.hasActiveInstance = this.instances.some(item => item.status === '1')
      })
    },
    selectInstance(item) {
      this.selectedInstanceId = item.instanceId
      this.selectedInstance = item
      this.loadAreas()
    },
    isEndedInstance() {
      return this.selectedInstance && this.selectedInstance.status === '2'
    },
    loadAreas() {
      const requestId = ++this.areaRequestId
      if (!this.selectedInstanceId || !this.selectedSchoolId) return Promise.resolve()
      this.loading = true
      const params = { instanceId: this.selectedInstanceId, schoolId: this.selectedSchoolId }
      return listAreas(params).then(res => {
        if (requestId !== this.areaRequestId) return
        this.areas = res.data || []
        this.gamesByArea = {}
        return Promise.all(this.areas.map(area => listGames(area.areaId).then(gameRes => {
          if (requestId === this.areaRequestId) {
            this.$set(this.gamesByArea, area.areaId, gameRes.data || [])
          }
        })))
      }).finally(() => {
        if (requestId === this.areaRequestId) this.loading = false
      })
    },
    editInstance(item) {
      this.openInstanceDialog(item)
    },
    openSchoolConfigDialog() {
      const schoolId = this.selectedSchoolId
      const instanceId = this.selectedInstanceId
      if (!schoolId || !instanceId) {
        this.$message.warning('请先选择学校和活动')
        return
      }
      this.schoolConfigForm = {}
      this.lotteryOptions = []
      listActivity({ pageNum: 1, pageSize: 1000 }).then(res => {
        this.lotteryOptions = res.rows || []
      })
      this.$set(this.schoolConfigForm, schoolId, { minFinishCount: 0, lotteryId: null, maxDrawCount: 1 })
      return listInstanceSchools(instanceId).then(res => {
        if (schoolId !== this.selectedSchoolId || instanceId !== this.selectedInstanceId) return
        const item = (res.data || []).find(config => config.schoolId === schoolId)
        if (item) {
          this.$set(this.schoolConfigForm, schoolId, {
            minFinishCount: item.minFinishCount || 0,
            lotteryId: item.lotteryId || null,
            maxDrawCount: item.maxDrawCount == null ? 1 : item.maxDrawCount
          })
        }
        this.schoolConfigDialogVisible = true
      })
    },
    lotteryOptionsForSchool(schoolId) {
      const selectedLotteryId = (this.schoolConfigForm[schoolId] || {}).lotteryId
      return (this.lotteryOptions || []).filter(lottery => {
        const closed = lottery.status === 0 || lottery.status === '0' || lottery.status === false
        return !closed || lottery.lotteryId === selectedLotteryId
      })
    },
    submitSchoolConfig() {
      const config = this.schoolConfigForm[this.selectedSchoolId] || {}
      const data = [{
        schoolId: this.selectedSchoolId,
        minFinishCount: config.minFinishCount || 0,
        lotteryId: config.lotteryId || null,
        maxDrawCount: config.maxDrawCount == null ? 1 : config.maxDrawCount
      }]
      saveInstanceSchools(this.selectedInstanceId, data).then(() => {
        this.$message.success('保存成功')
        this.schoolConfigDialogVisible = false
      })
    },
    instanceStatusName(status) {
      const map = { '0': '未开始', '1': '进行中', '2': '已结束', '3': '已停用' }
      return map[status] || '未知'
    },
    instanceStatusType(status) {
      const map = { '0': 'info', '1': 'success', '2': 'warning', '3': 'danger' }
      return map[status] || 'info'
    },
    toggleInstanceStatus(item, enabled) {
      const targetStatus = enabled ? '0' : '3'
      const actionText = enabled ? '启用' : '停用'
      this.$confirm(`确认${actionText}该活动实例？`, '提示').then(() => {
        saveInstance({ instanceId: item.instanceId, schoolId: this.selectedSchoolId, status: targetStatus }).then(() => {
          this.$message.success(`${actionText}成功`)
          this.loadInstances()
        })
      }).catch(() => {})
    },
    removeInstance(item) {
      const schoolId = this.selectedSchoolId
      const school = this.currentSchool
      if (!schoolId || !school || this.deletingInstanceId !== null) return
      this.deletingInstanceId = item.instanceId
      return this.$confirm(`确认删除“${school.title}”的“${item.title}”活动？仅移除本校活动，其他学校不受影响；区域、游戏和历史参与记录、报告均保留。`, '删除本校活动', {
        confirmButtonText: '删除本校活动',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => delInstance(item.instanceId, schoolId)).then(() => {
        this.$message.success('本校活动已删除，历史数据已保留')
        if (this.selectedSchoolId === schoolId) return this.loadInstances()
      }).catch(() => {}).finally(() => {
        this.deletingInstanceId = null
      })
    },
    definitionName(bizType) {
      const item = this.definitions.find(definition => definition.bizType === bizType)
      return item ? item.name : (bizType || '')
    },
    instanceOptionLabel(item) {
      return `${item.title}（${item.startTime || '-'} ~ ${item.endTime || '-'}）`
    },
    /** 打开“添加已有活动”弹窗：列出同活动类型、当前学校尚未添加的实例。 */
    openAddExistingDialog() {
      if (!this.selectedSchoolId) {
        this.$message.warning('请先选择学校')
        return
      }
      this.addExistingDialogVisible = true
      this.addExistingInstanceId = null
      this.addExistingCandidates = []
      this.addExistingLoading = true
      return listInstances({ bizType: this.selectedBizType }).then(res => {
        const rows = res.data || res.rows || []
        const existing = new Set((this.instances || []).map(item => item.instanceId))
        // 停用（3）的活动不参与恢复；已在本校列表中的活动无需重复添加。
        this.addExistingCandidates = rows.filter(item => !existing.has(item.instanceId) && item.status !== '3')
      }).catch(error => {
        this.$message.error((error && error.message) || '活动列表加载失败')
      }).finally(() => {
        this.addExistingLoading = false
      })
    },
    /** 将选中的活动实例绑定到当前学校；已删除的绑定会恢复。 */
    submitAddExisting() {
      if (!this.addExistingInstanceId) {
        this.$message.warning('请选择要添加的活动')
        return
      }
      if (this.addExistingSaving) return
      const instanceId = this.addExistingInstanceId
      this.addExistingSaving = true
      return addInstanceSchool(instanceId, this.selectedSchoolId).then(() => {
        this.$message.success('已添加到本校')
        this.addExistingDialogVisible = false
        return this.loadInstances().then(() => {
          const item = (this.instances || []).find(row => row.instanceId === instanceId)
          if (item) this.selectInstance(item)
        })
      }).catch(error => {
        this.$message.error((error && error.message) || '添加失败')
      }).finally(() => {
        this.addExistingSaving = false
      })
    },
    openInstanceDialog(item) {
      if (!this.selectedSchoolId) {
        this.$message.warning('请先选择学校')
        return
      }
      const isEdit = item && item.instanceId
      this.instanceDialogTitle = isEdit ? '编辑活动实例' : '新增活动实例'
      this.instanceForm = Object.assign({}, isEdit ? item : {
        bizType: this.selectedBizType,
        title: '',
        bannerUrl: '',
        startTime: null,
        endTime: null
      }, { schoolId: this.selectedSchoolId })
      this.instanceDialogVisible = true
    },
    submitInstance() {
      if (this.instanceSaving) return
      const payload = Object.assign({}, this.instanceForm)
      if (!payload.schoolId) {
        this.$message.warning('请先选择学校')
        return
      }
      if (!payload.bizType || !payload.title || !payload.title.trim() || !payload.startTime || !payload.endTime) {
        this.$message.warning('请填写活动类型、名称及起止时间')
        return
      }
      const start = new Date(payload.startTime + 'T00:00:00').getTime()
      const end = new Date(payload.endTime + 'T23:59:59').getTime()
      if (start > end) {
        this.$message.warning('结束时间不能早于开始时间')
        return
      }
      if (!payload.instanceId && end < Date.now()) {
        this.$message.warning('不能添加已结束的活动')
        return
      }
      // 时间冲突由后端按提交的学校和活动类型统一校验，避免使用过期或其他类型的列表误判。
      this.instanceSaving = true
      return saveInstance(payload).then(() => {
        this.$message.success('保存成功')
        this.instanceDialogVisible = false
        return this.loadInstances()
      }).finally(() => {
        this.instanceSaving = false
      })
    },
    openAreaDialog() {
      this.areaDialogTitle = '新增区域'
      this.areaForm = {
        instanceId: this.selectedInstanceId,
        title: '',
        schoolId: this.selectedSchoolId || null,
        sortOrder: this.areas.length + 1
      }
      this.areaDialogVisible = true
    },
    submitArea() {
      if (!this.areaForm.schoolId) {
        this.$message.warning('请选择所属学校')
        return
      }
      saveArea(this.areaForm).then(() => {
        this.$message.success('保存成功')
        this.areaDialogVisible = false
        this.loadAreas()
      })
    },
    removeArea(area) {
      this.$confirm('确认删除该区域？', '提示').then(() => {
        delArea(area.areaId).then(() => {
          this.$message.success('删除成功')
          this.loadAreas()
        })
      }).catch(() => {})
    },
    openGameDialog(area) {
      this.gameDialogTitle = '新增游戏'
      this.gameForm = {
        areaId: area.areaId,
        instanceId: this.selectedInstanceId,
        title: '',
        gameCategory: null,
        gameType: null,
        configId: null,
        sortOrder: (this.gamesByArea[area.areaId] || []).length + 1,
        requiredFlag: '0'
      }
      this.gameDialogVisible = true
    },
    handleGameTypeChange(gameType) {
      this.gameForm.configId = null
      this.gameForm.title = ''
      this.gameConfigs = []
      if (gameType) {
        listGameConfigs(gameType, '0').then(res => {
          this.gameConfigs = res.data || []
        })
      }
    },
    handleGameConfigChange(configId) {
      const config = this.gameConfigs.find(item => item.configId === configId)
      if (config) {
        this.gameForm.title = config.gameName
      }
    },
    submitGame() {
      if (!this.gameForm.configId) {
        this.$message.warning('请选择游戏配置')
        return
      }
      const config = this.gameConfigs.find(item => item.configId === this.gameForm.configId)
      if (!config) {
        this.$message.warning('游戏配置不存在，请重新选择')
        return
      }
      if (config) {
        this.gameForm.title = config.gameName
        // gameCategory 只负责界面显示；提交时使用副本转换为后端路由，避免英文路由回写到下拉框。
        const route = config.route || config.gameType
        this.gameForm.config = JSON.stringify({ configId: config.configId, route })
      }
      const payload = Object.assign({}, this.gameForm, {
        gameType: config.route || config.gameType
      })
      saveGame(payload).then(() => {
        this.$message.success('保存成功')
        this.gameDialogVisible = false
        this.loadAreas()
      })
    },
    removeGame(game, area) {
      this.$confirm('确认删除该游戏？', '提示').then(() => {
        delGame(game.gameId).then(() => {
          this.$message.success('删除成功')
          this.loadAreas()
        })
      }).catch(() => {})
    },
    previewQr(game) {
      this.currentGameId = game.gameId
      this.qrTitle = game.title
      this.qrUrl = process.env.VUE_APP_BASE_API + '/activity/week/game/qrcode/preview/' + game.gameId
      this.qrDialogVisible = true
    },

    viewGame(game) {
      this.$router.push({ path: '/activity/week/game-view/' + game.gameId })
    },
    regenerateQr() {
      if (!this.currentGameId) return
      regenerateGameQrCode(this.currentGameId).then(() => {
        this.$message.success('二维码已重新生成')
        this.qrUrl = process.env.VUE_APP_BASE_API + '/activity/week/game/qrcode/preview/' + this.currentGameId + '?t=' + Date.now()
      })
    }
  }
}
</script>

<style scoped>
.instance-list {
  margin: 16px 0;
}
.instance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
}
.instance-main {
  flex: 1;
}
.instance-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}
.instance-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.instance-switch,
.instance-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
}
.instance-actions {
  display: flex;
  gap: 4px;
}
.area-card {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
}
.area-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
}
.form-tip {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}
</style>
