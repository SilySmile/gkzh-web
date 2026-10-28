<template>
  <div class="app-container">
    <el-alert
      title="能量雷达固定 15 个价值观维度、6 个关卡和每关 5 件物品。维度编码、关卡号和选项字母由游戏规则决定，不能修改；可维护关卡名称、任务情景、物品名称与说明、所属维度、解读文案、排序和启停。计分要求每个维度在全表 30 件物品中恰好出现 2 次，调整物品所属维度时服务端会校验每个维度仍需对应 2 件物品，否则拒绝保存。"
      type="info"
      :closable="false"
      class="tip"
    />

    <el-tabs v-model="activeTab">
      <el-tab-pane label="关卡与物品" name="rounds">
        <el-table v-loading="loading" :data="rounds" row-key="roundId" border stripe>
          <el-table-column type="expand">
            <template slot-scope="scope">
              <div class="option-wrap">
                <el-table :data="scope.row.options || []" size="small" border>
                  <el-table-column prop="optionLabel" label="选项" width="70" align="center" />
                  <el-table-column prop="optionName" label="物品名称" min-width="200" />
                  <el-table-column prop="optionDesc" label="物品说明" min-width="320" show-overflow-tooltip />
                  <el-table-column prop="dimensionName" label="所属维度" width="130" align="center" />
                  <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
                  <el-table-column label="状态" width="80" align="center">
                    <template slot-scope="item">
                      <el-tag :type="item.row.status === '0' ? 'success' : 'info'" size="mini">{{ item.row.status === '0' ? '启用' : '停用' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80" align="center">
                    <template slot-scope="item">
                      <el-button type="text" size="small" @click="openOption(item.row)">编辑</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="关卡" width="90" align="center">
            <template slot-scope="scope">第 {{ scope.row.roundNo }} 关</template>
          </el-table-column>
          <el-table-column prop="title" label="关卡名称" width="220" />
          <el-table-column prop="scene" label="任务情景" min-width="420" show-overflow-tooltip />
          <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
          <el-table-column label="状态" width="80" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === '0' ? 'success' : 'info'" size="mini">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openRound(scope.row)">编辑关卡</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="维度解读" name="dimensions">
        <el-table v-loading="loading" :data="dimensions" border stripe>
          <el-table-column prop="dimensionName" label="维度" width="120" align="center" />
          <el-table-column prop="dimensionCode" label="编码" width="130" align="center" />
          <el-table-column prop="dimensionGroup" label="分组" width="200" align="center" />
          <el-table-column prop="summary" label="渴望/期待" min-width="360" show-overflow-tooltip />
          <el-table-column prop="careerReference" label="职业参考" min-width="400" show-overflow-tooltip />
          <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
          <el-table-column label="状态" width="80" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === '0' ? 'success' : 'info'" size="mini">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openDimension(scope.row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog :title="'编辑关卡：' + (roundForm.title || '')" :visible.sync="roundVisible" width="640px" append-to-body>
      <el-form ref="roundForm" :model="roundForm" :rules="roundRules" label-width="100px" size="small">
        <el-form-item label="关卡名称" prop="title">
          <el-input v-model.trim="roundForm.title" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="任务情景" prop="scene">
          <el-input v-model="roundForm.scene" type="textarea" :rows="6" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="roundForm.sortOrder" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="roundForm.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="roundVisible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitRound">保 存</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="'编辑物品：' + (optionForm.optionLabel || '') + ' ' + (optionForm.optionName || '')" :visible.sync="optionVisible" width="640px" append-to-body>
      <el-form ref="optionForm" :model="optionForm" :rules="optionRules" label-width="100px" size="small">
        <el-form-item label="选项字母">
          <el-input :value="optionForm.optionLabel" disabled />
        </el-form-item>
        <el-form-item label="物品名称" prop="optionName">
          <el-input v-model.trim="optionForm.optionName" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="物品说明">
          <el-input v-model="optionForm.optionDesc" type="textarea" :rows="4" maxlength="1000" show-word-limit />
        </el-form-item>
        <el-form-item label="所属维度" prop="dimensionId">
          <el-select v-model="optionForm.dimensionId" filterable placeholder="请选择维度" style="width: 100%">
            <el-option v-for="item in dimensions" :key="item.dimensionId" :label="item.dimensionName + '（' + item.dimensionGroup + '）'" :value="item.dimensionId" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="optionForm.sortOrder" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="optionForm.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="optionVisible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitOption">保 存</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="'编辑维度：' + (dimensionForm.dimensionName || '')" :visible.sync="dimensionVisible" width="720px" append-to-body>
      <el-form ref="dimensionForm" :model="dimensionForm" :rules="dimensionRules" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="维度名称" prop="dimensionName">
              <el-input v-model.trim="dimensionForm.dimensionName" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维度编码">
              <el-input :value="dimensionForm.dimensionCode" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="分组" prop="dimensionGroup">
          <el-select v-model="dimensionForm.dimensionGroup" style="width: 100%">
            <el-option label="内在价值" value="内在价值" />
            <el-option label="外在与保障" value="外在与保障" />
            <el-option label="人际影响与生活方式" value="人际影响与生活方式" />
          </el-select>
        </el-form-item>
        <el-form-item label="渴望/期待">
          <el-input v-model="dimensionForm.summary" type="textarea" :rows="4" maxlength="1000" show-word-limit />
        </el-form-item>
        <el-form-item label="职业参考">
          <el-input v-model="dimensionForm.careerReference" type="textarea" :rows="6" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="dimensionForm.sortOrder" :min="0" :max="999" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="dimensionForm.status">
                <el-radio label="0">启用</el-radio>
                <el-radio label="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dimensionVisible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitDimension">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listDimensions,
  saveDimension,
  listRounds,
  saveRound,
  saveOption,
  nlldErrorMessage
} from '@/api/nlld'

export default {
  name: 'NlldConfig',
  data() {
    return {
      activeTab: 'rounds',
      loading: false,
      saving: false,
      rounds: [],
      dimensions: [],
      roundVisible: false,
      roundForm: {},
      roundRules: {
        title: [{ required: true, message: '请输入关卡名称', trigger: 'blur' }]
      },
      optionVisible: false,
      optionForm: {},
      optionRules: {
        optionName: [{ required: true, message: '请输入物品名称', trigger: 'blur' }],
        dimensionId: [{ required: true, message: '请选择所属维度', trigger: 'change' }]
      },
      dimensionVisible: false,
      dimensionForm: {},
      dimensionRules: {
        dimensionName: [{ required: true, message: '请输入维度名称', trigger: 'blur' }],
        dimensionGroup: [{ required: true, message: '请选择维度分组', trigger: 'change' }]
      }
    }
  },
  created() {
    this.load()
  },
  methods: {
    load() {
      this.loading = true
      Promise.all([listRounds(), listDimensions()])
        .then(([roundRes, dimensionRes]) => {
          this.rounds = roundRes.data || []
          this.dimensions = dimensionRes.data || []
        })
        .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    openRound(row) {
      this.roundForm = Object.assign({}, row)
      this.roundVisible = true
      this.$nextTick(() => this.$refs.roundForm && this.$refs.roundForm.clearValidate())
    },
    submitRound() {
      this.$refs.roundForm.validate(valid => {
        if (!valid || this.saving) return
        this.saving = true
        saveRound(this.roundForm.roundId, this.roundForm)
          .then(() => {
            this.$modal.msgSuccess('关卡配置已保存')
            this.roundVisible = false
            this.load()
          })
          .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
          .finally(() => {
            this.saving = false
          })
      })
    },
    openOption(row) {
      this.optionForm = Object.assign({}, row)
      this.optionVisible = true
      this.$nextTick(() => this.$refs.optionForm && this.$refs.optionForm.clearValidate())
    },
    submitOption() {
      this.$refs.optionForm.validate(valid => {
        if (!valid || this.saving) return
        this.saving = true
        saveOption(this.optionForm.optionId, this.optionForm)
          .then(() => {
            this.$modal.msgSuccess('物品配置已保存')
            this.optionVisible = false
            this.load()
          })
          .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
          .finally(() => {
            this.saving = false
          })
      })
    },
    openDimension(row) {
      this.dimensionForm = Object.assign({}, row)
      this.dimensionVisible = true
      this.$nextTick(() => this.$refs.dimensionForm && this.$refs.dimensionForm.clearValidate())
    },
    submitDimension() {
      this.$refs.dimensionForm.validate(valid => {
        if (!valid || this.saving) return
        this.saving = true
        saveDimension(this.dimensionForm.dimensionId, this.dimensionForm)
          .then(() => {
            this.$modal.msgSuccess('维度解读已保存')
            this.dimensionVisible = false
            this.load()
          })
          .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
          .finally(() => {
            this.saving = false
          })
      })
    }
  }
}
</script>

<style scoped>
.tip {
  margin-bottom: 16px;
}
.option-wrap {
  padding: 8px 16px 12px 48px;
  background: #fafafa;
}
</style>
