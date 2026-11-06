<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" v-loading="loading">
      <el-tab-pane label="棋盘设置" name="board">
        <el-alert
          title="棋盘为 19 格环形布局，行列位置固定；这里只调整每格的类型、答题知识点、文案、底色与启停。第 19 格必须保持为终点。"
          type="info"
          :closable="false"
          class="tip"
        />
        <el-table :data="cells" border stripe>
          <el-table-column prop="cellNo" label="格号" width="80" align="center" />
          <el-table-column label="格子类型" width="110" align="center">
            <template slot-scope="scope">
              <el-tag :type="cellTypeTag(scope.row.cellType)">{{ cellTypeName(scope.row.cellType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="知识点" width="130" align="center">
            <template slot-scope="scope">
              {{ scope.row.questionType ? questionTypeName(scope.row.questionType) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="格子文案" min-width="140" align="center">
            <template slot-scope="scope">{{ scope.row.cellLabel || '-' }}</template>
          </el-table-column>
          <el-table-column label="底色" width="110" align="center">
            <template slot-scope="scope">
              <span class="color-swatch" :style="{ background: scope.row.cellColor }"></span>
              <span class="color-text">{{ scope.row.cellColor }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">
                {{ scope.row.status === '0' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template slot-scope="scope">
              <el-button
                v-hasPermi="['zyfxq:config:edit']"
                type="text"
                size="small"
                @click="openCell(scope.row)"
                >编辑</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="规则参数" name="setting">
        <el-alert
          title="参数在每局开始时固化到本局记录，对局中途修改不会影响正在进行的对局。"
          type="info"
          :closable="false"
          class="tip"
        />
        <el-form ref="settingForm" :model="setting" label-width="150px" style="max-width: 620px">
          <el-form-item label="单局总时长（秒）">
            <el-input-number v-model="setting.totalSeconds" :min="30" :max="1800" :step="10" />
            <span class="hint">到点未抵达终点判定为未通关，需求默认 180 秒</span>
          </el-form-item>
          <el-form-item label="单题限时（秒）">
            <el-input-number v-model="setting.questionSeconds" :min="5" :max="300" :step="5" />
            <span class="hint">超时按答错处理，需求默认 20 秒</span>
          </el-form-item>
          <el-form-item label="答错后退格数">
            <el-input-number v-model="setting.backSteps" :min="0" :max="10" />
            <span class="hint">答错或超时后退的格数，需求默认 2 格</span>
          </el-form-item>
          <el-form-item label="骰子面数">
            <el-input-number v-model="setting.diceFaces" :min="1" :max="12" />
            <span class="hint">单骰取 1 到该值，需求默认 6 面</span>
          </el-form-item>
          <el-form-item label="是否启用">
            <el-switch v-model="setting.enabled" active-value="1" inactive-value="0" />
            <span class="hint">停用后学生端扫码进入会被拒绝</span>
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['zyfxq:config:edit']"
              type="primary"
              :loading="saving"
              @click="submitSetting"
              >保存参数</el-button
            >
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="题库维护" name="question">
        <el-form :inline="true" size="small" class="filter">
          <el-form-item label="知识点">
            <el-select v-model="questionType" clearable placeholder="全部知识点" @change="filteredQuestions">
              <el-option label="职业问答" value="career" />
              <el-option label="情景任务卡" value="scenario" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button v-hasPermi="['zyfxq:config:edit']" type="primary" icon="el-icon-plus" @click="openQuestion()"
              >新增题目</el-button
            >
          </el-form-item>
        </el-form>
        <el-table :data="filteredQuestions" border stripe>
          <el-table-column prop="questionId" label="编号" width="80" align="center" />
          <el-table-column label="知识点" width="130" align="center">
            <template slot-scope="scope">{{ questionTypeName(scope.row.questionType) }}</template>
          </el-table-column>
          <el-table-column prop="title" label="题干" min-width="340" show-overflow-tooltip />
          <el-table-column label="选项" width="80" align="center">
            <template slot-scope="scope">{{ (scope.row.options || []).length }}</template>
          </el-table-column>
          <el-table-column label="正确选项" width="110" align="center">
            <template slot-scope="scope">{{ correctLabel(scope.row.options) }}</template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">
                {{ scope.row.status === '0' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" align="center">
            <template slot-scope="scope">
              <el-button
                v-hasPermi="['zyfxq:config:edit']"
                type="text"
                size="small"
                @click="openQuestion(scope.row)"
                >编辑</el-button
              >
              <el-button
                v-hasPermi="['zyfxq:config:edit']"
                type="text"
                size="small"
                class="danger-text"
                @click="removeQuestion(scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog :title="'编辑第 ' + cellForm.cellNo + ' 格'" :visible.sync="cellVisible" width="520px" append-to-body>
      <el-form :model="cellForm" label-width="110px">
        <el-form-item label="格子类型">
          <el-select v-model="cellForm.cellType" :disabled="cellForm.cellNo === 19">
            <el-option label="普通格" value="normal" />
            <el-option label="答题格" value="question" />
            <el-option label="终点" value="end" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cellForm.cellType === 'question'" label="知识点">
          <el-select v-model="cellForm.questionType" placeholder="请选择知识点">
            <el-option label="职业问答" value="career" />
            <el-option label="情景任务卡" value="scenario" />
          </el-select>
        </el-form-item>
        <el-form-item label="格子文案">
          <el-input v-model="cellForm.cellLabel" maxlength="50" placeholder="例如职业问答、情景任务卡、终点" />
        </el-form-item>
        <el-form-item label="底色">
          <el-color-picker v-model="cellForm.cellColor" />
          <span class="hint">{{ cellForm.cellColor }}</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="cellForm.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="cellVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCell">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="questionForm.questionId ? '编辑题目' : '新增题目'"
      :visible.sync="questionVisible"
      width="720px"
      append-to-body
    >
      <el-form :model="questionForm" label-width="100px">
        <el-form-item label="知识点">
          <el-select v-model="questionForm.questionType">
            <el-option label="职业问答" value="career" />
            <el-option label="情景任务卡" value="scenario" />
          </el-select>
        </el-form-item>
        <el-form-item label="题干">
          <el-input v-model="questionForm.title" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="选项与答案">
          <div v-for="(option, index) in questionForm.options" :key="index" class="option-row">
            <el-radio v-model="correctIndex" :label="index" class="option-radio">正确答案</el-radio>
            <span class="option-label">{{ option.optionLabel }}</span>
            <el-input v-model="option.optionContent" maxlength="500" placeholder="请输入选项内容" />
          </div>
          <div class="hint">4 个选项必填，且必须且只能勾选一个正确答案。</div>
        </el-form-item>
        <el-form-item label="题目解析">
          <el-input
            v-model="questionForm.analysis"
            type="textarea"
            :rows="2"
            maxlength="1000"
            placeholder="学生答错后可展示的解析，可为空"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="questionForm.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="questionForm.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="questionVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="submitQuestion">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getConfig,
  saveCell,
  saveSetting,
  saveQuestion,
  deleteQuestion,
  zyfxqErrorMessage,
} from '@/api/zyfxq'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

/** 新增题目时的空表单；正确选项默认第一个。 */
function emptyQuestion(type) {
  return {
    questionId: null,
    questionType: type || 'career',
    title: '',
    analysis: '',
    sortOrder: 0,
    status: '0',
    options: OPTION_LABELS.map((label, index) => ({
      optionLabel: label,
      optionContent: '',
      isCorrect: index === 0 ? '1' : '0',
    })),
  }
}

export default {
  name: 'ZyfxqConfig',
  data() {
    return {
      loading: false,
      saving: false,
      activeTab: 'board',
      cells: [],
      setting: {
        totalSeconds: 180,
        questionSeconds: 20,
        backSteps: 2,
        diceFaces: 6,
        enabled: '1',
      },
      questions: [],
      questionType: null,
      cellVisible: false,
      cellForm: {},
      questionVisible: false,
      questionForm: emptyQuestion(),
      correctIndex: 0,
    }
  },
  computed: {
    /** 题库按知识点过滤，切换下拉时不需要重新请求。 */
    filteredQuestions() {
      if (!this.questionType) return this.questions
      return this.questions.filter((item) => item.questionType === this.questionType)
    },
  },
  created() {
    this.load()
  },
  methods: {
    load() {
      this.loading = true
      getConfig()
        .then((res) => {
          const data = res.data || {}
          this.cells = data.cells || []
          this.setting = data.setting || this.setting
          this.questions = data.questions || []
        })
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    cellTypeName(type) {
      if (type === 'question') return '答题格'
      if (type === 'end') return '终点'
      return '普通格'
    },
    cellTypeTag(type) {
      if (type === 'question') return 'warning'
      if (type === 'end') return 'danger'
      return 'info'
    },
    questionTypeName(type) {
      if (type === 'career') return '职业问答'
      if (type === 'scenario') return '情景任务卡'
      return '-'
    },
    correctLabel(options) {
      const hit = (options || []).find((item) => item.isCorrect === '1')
      return hit ? hit.optionLabel : '-'
    },
    openCell(row) {
      this.cellForm = { ...row }
      this.cellVisible = true
    },
    submitCell() {
      if (this.cellForm.cellType === 'question' && !this.cellForm.questionType) {
        this.$modal.msgWarning('答题格必须选择知识点')
        return
      }
      this.saving = true
      const payload = {
        cellType: this.cellForm.cellType,
        questionType: this.cellForm.cellType === 'question' ? this.cellForm.questionType : null,
        cellLabel: this.cellForm.cellLabel,
        cellColor: this.cellForm.cellColor,
        status: this.cellForm.status,
      }
      saveCell(this.cellForm.cellNo, payload)
        .then(() => {
          this.$modal.msgSuccess('已保存')
          this.cellVisible = false
          this.load()
        })
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
        .finally(() => {
          this.saving = false
        })
    },
    submitSetting() {
      this.saving = true
      saveSetting({ ...this.setting })
        .then((res) => {
          this.$modal.msgSuccess('已保存')
          if (res.data) this.setting = res.data
        })
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
        .finally(() => {
          this.saving = false
        })
    },
    openQuestion(row) {
      if (row) {
        const options = OPTION_LABELS.map((label, index) => {
          const existing = (row.options || []).find((item) => item.optionLabel === label) || {}
          return {
            optionLabel: label,
            optionContent: existing.optionContent || '',
            isCorrect: existing.isCorrect || '0',
          }
        })
        this.questionForm = {
          questionId: row.questionId,
          questionType: row.questionType,
          title: row.title,
          analysis: row.analysis || '',
          sortOrder: row.sortOrder || 0,
          status: row.status || '0',
          options,
        }
        this.correctIndex = Math.max(
          0,
          options.findIndex((item) => item.isCorrect === '1'),
        )
      } else {
        this.questionForm = emptyQuestion(this.questionType)
        this.correctIndex = 0
      }
      this.questionVisible = true
    },
    submitQuestion() {
      const form = this.questionForm
      if (!form.title || !form.title.trim()) {
        this.$modal.msgWarning('请填写题干')
        return
      }
      const empty = form.options.some((item) => !item.optionContent || !item.optionContent.trim())
      if (empty) {
        this.$modal.msgWarning('4 个选项都必须填写')
        return
      }
      const payload = {
        questionId: form.questionId,
        questionType: form.questionType,
        title: form.title.trim(),
        analysis: form.analysis,
        sortOrder: form.sortOrder,
        status: form.status,
        options: form.options.map((item, index) => ({
          optionLabel: item.optionLabel,
          optionContent: item.optionContent.trim(),
          isCorrect: index === this.correctIndex ? '1' : '0',
        })),
      }
      this.saving = true
      saveQuestion(payload)
        .then(() => {
          this.$modal.msgSuccess('已保存')
          this.questionVisible = false
          this.load()
        })
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
        .finally(() => {
          this.saving = false
        })
    },
    removeQuestion(row) {
      this.$modal
        .confirm('删除题目「' + row.title + '」及其选项？历史答题明细仍保留快照。')
        .then(() => deleteQuestion(row.questionId))
        .then(() => {
          this.$modal.msgSuccess('已删除')
          this.load()
        })
        .catch((error) => {
          if (error !== 'cancel') this.$modal.msgError(zyfxqErrorMessage(error))
        })
    },
  },
}
</script>

<style scoped>
.tip {
  margin-bottom: 16px;
}
.filter {
  margin-bottom: 8px;
}
.hint {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.color-swatch {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #dcdfe6;
  vertical-align: middle;
  margin-right: 6px;
}
.color-text {
  color: #909399;
  font-size: 12px;
}
.option-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.option-radio {
  width: 100px;
  margin-right: 0;
}
.option-label {
  width: 28px;
  font-weight: 600;
  color: #606266;
}
.danger-text {
  color: #f56c6c;
}
</style>
