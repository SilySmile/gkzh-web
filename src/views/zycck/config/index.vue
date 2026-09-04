<template>
  <div class="app-container zycck-config">
    <el-alert
      title="未来职业猜猜看配置"
      type="info"
      :closable="false"
      description="五个职业大类各维护 10 个职业/题目。一条职业只绑定一道题，固定模式需 1 个候选，随机池模式需 3 个候选。保存配置后，进行中的游戏会按最新内容生成配置快照。"
      class="page-tip"
    />

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="职业大类" name="categories">
        <div class="toolbar">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="openCategoryDialog()">新增大类</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="loadCategories">刷新</el-button>
        </div>
        <el-table v-loading="categoryLoading" :data="categories" border stripe>
          <el-table-column prop="sortOrder" label="排序" width="75" align="center" />
          <el-table-column prop="name" label="职业大类" min-width="180" />
          <el-table-column prop="description" label="说明" min-width="240" show-overflow-tooltip />
          <el-table-column label="抽题模式" width="120" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.drawMode === 'random' ? 'warning' : 'success'">
                {{ scope.row.drawMode === 'random' ? '随机池（3题）' : '固定（1题）' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="题目数" width="90" align="center">
            <template slot-scope="scope">{{ categoryQuestionCount(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="候选数" width="90" align="center">
            <template slot-scope="scope">{{ categoryCandidateCount(scope.row) }} / {{ scope.row.drawMode === 'random' ? 3 : 1 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="scope"><el-tag :type="String(scope.row.status) === '0' ? 'success' : 'info'">{{ String(scope.row.status) === '0' ? '启用' : '停用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="openCategoryDialog(scope.row)">编辑</el-button>
              <el-button type="text" size="mini" @click="showQuestions(scope.row)">查看题目</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!categoryLoading && !categories.length" description="暂无职业大类，请先新增或等待后端初始化" />
      </el-tab-pane>

      <el-tab-pane label="职业与题目" name="questions">
        <div class="toolbar toolbar-filter">
          <el-select v-model="questionQuery.categoryId" clearable filterable placeholder="全部职业大类" size="small" @change="loadQuestions">
            <el-option v-for="item in categories" :key="item.categoryId" :label="item.name" :value="item.categoryId" />
          </el-select>
          <el-input v-model="questionQuery.keyword" clearable size="small" placeholder="职业名称/题目关键词" class="keyword" @keyup.enter.native="loadQuestions" />
          <el-button type="primary" size="small" icon="el-icon-search" @click="loadQuestions">查询</el-button>
          <el-button type="success" size="small" icon="el-icon-plus" @click="openQuestionDialog()">新增职业题目</el-button>
        </div>
        <el-table v-loading="questionLoading" :data="questions" border stripe>
          <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
          <el-table-column prop="categoryName" label="职业大类" width="160" />
          <el-table-column prop="careerName" label="职业名称" width="180" />
          <el-table-column label="候选状态" width="120" align="center">
            <template slot-scope="scope"><el-tag :type="isCandidate(scope.row.drawCandidate) ? 'success' : 'info'">{{ isCandidate(scope.row.drawCandidate) ? '候选题' : '普通题' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="图片" width="80" align="center"><template slot-scope="scope"><i :class="scope.row.questionImageUrl ? 'el-icon-picture' : 'el-icon-picture-outline'" /></template></el-table-column>
          <el-table-column label="状态" width="80" align="center"><template slot-scope="scope">{{ String(scope.row.status) === '0' ? '启用' : '停用' }}</template></el-table-column>
          <el-table-column label="操作" width="180" align="center"><template slot-scope="scope"><el-button type="text" size="mini" @click="preview(scope.row)">预览</el-button><el-button type="text" size="mini" @click="openQuestionDialog(scope.row)">编辑</el-button><el-button type="text" size="mini" @click="removeQuestion(scope.row)">删除</el-button></template></el-table-column>
        </el-table>
        <pagination v-show="questionTotal > 0" :total="questionTotal" :page.sync="questionQuery.pageNum" :limit.sync="questionQuery.pageSize" @pagination="loadQuestions" />
        <el-empty v-if="!questionLoading && !questions.length" description="暂无职业题目" />
      </el-tab-pane>
    </el-tabs>

    <el-dialog :title="categoryForm.categoryId ? '编辑职业大类' : '新增职业大类'" :visible.sync="categoryDialogVisible" width="500px" append-to-body>
      <el-form ref="categoryForm" :model="categoryForm" :rules="categoryRules" label-width="90px">
        <el-form-item label="大类编码" prop="code"><el-input v-model="categoryForm.code" maxlength="32" placeholder="例如 digital_product" /></el-form-item>
        <el-form-item label="大类名称" prop="name"><el-input v-model="categoryForm.name" maxlength="64" /></el-form-item>
        <el-form-item label="大类说明"><el-input v-model="categoryForm.description" type="textarea" maxlength="500" /></el-form-item>
        <el-form-item label="抽题模式" prop="drawMode"><el-radio-group v-model="categoryForm.drawMode"><el-radio label="fixed">固定（1题）</el-radio><el-radio label="random">随机池（3题）</el-radio></el-radio-group></el-form-item>
        <el-form-item label="排序" prop="sortOrder"><el-input-number v-model="categoryForm.sortOrder" :min="1" :max="99" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="categoryEnabled" active-text="启用" inactive-text="停用" /></el-form-item>
      </el-form>
      <div slot="footer"><el-button @click="categoryDialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submitCategory">保存</el-button></div>
    </el-dialog>

    <el-dialog :title="questionForm.careerQuestionId ? '编辑职业题目' : '新增职业题目'" :visible.sync="questionDialogVisible" width="860px" append-to-body>
      <el-form ref="questionForm" :model="questionForm" :rules="questionRules" label-width="110px" size="small">
        <el-form-item label="职业大类" prop="categoryId"><el-select v-model="questionForm.categoryId" filterable placeholder="请选择" style="width: 100%"><el-option v-for="item in categories" :key="item.categoryId" :label="item.name + '（' + drawModeText(item.drawMode) + '）'" :value="item.categoryId" /></el-select></el-form-item>
        <el-form-item label="职业名称" prop="careerName"><el-input v-model="questionForm.careerName" maxlength="100" /></el-form-item>
        <el-divider content-position="left">职业详情（一个职业对应一道题）</el-divider>
        <el-form-item label="职业场景图"><ImageUpload v-model="questionForm.careerImageUrl" :limit="1" /></el-form-item>
        <el-form-item label="职业简介"><el-input v-model="questionForm.oneLineIntro" maxlength="300" show-word-limit /></el-form-item>
        <el-form-item label="主要工作"><el-input v-model="questionForm.mainWork" type="textarea" :rows="3" maxlength="1000" show-word-limit /></el-form-item>
        <el-form-item label="一天可能做什么"><el-input v-model="questionForm.dayExample" type="textarea" :rows="3" maxlength="1000" show-word-limit /></el-form-item>
        <el-form-item label="为什么有此职业"><el-input v-model="questionForm.whyExists" type="textarea" :rows="3" maxlength="1000" show-word-limit /></el-form-item>
        <el-divider content-position="left">竞猜题目</el-divider>
        <el-form-item label="题目场景图"><ImageUpload v-model="questionForm.questionImageUrl" :limit="1" /></el-form-item>
        <el-row :gutter="12" v-for="option in optionRows" :key="option.key">
          <el-col :span="11"><el-form-item :label="'选项 ' + option.label" :prop="option.text"><el-input v-model="questionForm[option.text]" :placeholder="'请输入选项 ' + option.label + ' 文案'" /></el-form-item></el-col>
          <el-col :span="13"><el-form-item label="对应职业" :prop="option.career"><el-select v-model="questionForm[option.career]" filterable clearable placeholder="请选择职业（中文）" style="width: 100%"><el-option v-for="career in careerOptions" :key="career.careerQuestionId" :label="career.careerName" :value="career.careerQuestionId" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="正确选项" prop="correctOptionKey"><el-radio-group v-model="questionForm.correctOptionKey"><el-radio label="A">A</el-radio><el-radio label="B">B</el-radio><el-radio label="C">C</el-radio><el-radio label="D">D</el-radio></el-radio-group></el-form-item>
        <el-form-item label="答案解析"><el-input v-model="questionForm.explanation" type="textarea" :rows="3" maxlength="1000" show-word-limit /></el-form-item>
        <el-form-item label="抽题候选"><el-switch v-model="questionForm.drawCandidate" active-text="加入当前大类候选池" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="questionForm.sortOrder" :min="1" :max="999" /></el-form-item>
      </el-form>
      <div slot="footer"><el-button @click="questionDialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submitQuestion">保存</el-button></div>
    </el-dialog>

    <el-dialog title="题目预览" :visible.sync="previewVisible" width="620px" append-to-body>
      <div v-if="previewQuestion" class="question-preview">
        <el-tag type="info">{{ previewQuestion.categoryName || '职业大类' }}</el-tag><h3>{{ previewQuestion.careerName }}</h3>
        <p>{{ previewQuestion.oneLineIntro || '暂无职业简介' }}</p>
        <el-image v-if="previewQuestion.questionImageUrl" :src="previewQuestion.questionImageUrl" fit="contain" class="preview-image" :preview-src-list="[previewQuestion.questionImageUrl]" />
        <p><b>猜猜以上内容是下面哪个职业的工作场景？</b></p>
        <div v-for="item in previewOptions" :key="item.key" class="preview-option">{{ item.key }}. {{ item.text || '未填写' }}<el-tag v-if="item.key === previewQuestion.correctOptionKey" size="mini" type="success">正确答案</el-tag></div>
        <el-divider /><p><b>主要工作：</b>{{ previewQuestion.mainWork || '暂无' }}</p><p><b>一天可能做什么：</b>{{ previewQuestion.dayExample || '暂无' }}</p><p><b>为什么有此职业：</b>{{ previewQuestion.whyExists || '暂无' }}</p><p><b>答案解析：</b>{{ previewQuestion.explanation || '暂无' }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listCategories, saveCategory, listCareerQuestions, saveCareerQuestion, deleteCareerQuestion, zycckErrorMessage } from '@/api/zycck'

const emptyQuestion = () => ({ categoryId: null, careerName: '', oneLineIntro: '', mainWork: '', dayExample: '', whyExists: '', explanation: '', questionImageUrl: '', careerImageUrl: '', optionA: '', optionB: '', optionC: '', optionD: '', optionACareerId: '', optionBCareerId: '', optionCCareerId: '', optionDCareerId: '', correctOptionKey: 'A', drawCandidate: false, sortOrder: 1, status: '0' })

export default {
  name: 'ZycckConfig',
  data() {
    return {
      activeTab: 'categories', categoryLoading: false, questionLoading: false, saving: false,
      categories: [], questions: [], allQuestions: [], questionTotal: 0,
      categoryDialogVisible: false, questionDialogVisible: false, previewVisible: false, previewQuestion: null,
      categoryForm: {}, questionForm: emptyQuestion(),
      questionQuery: { pageNum: 1, pageSize: 10, categoryId: null, keyword: null },
      optionRows: [{ key: 'A', label: 'A', text: 'optionA', career: 'optionACareerId' }, { key: 'B', label: 'B', text: 'optionB', career: 'optionBCareerId' }, { key: 'C', label: 'C', text: 'optionC', career: 'optionCCareerId' }, { key: 'D', label: 'D', text: 'optionD', career: 'optionDCareerId' }],
      categoryRules: { code: [{ required: true, message: '请输入大类编码', trigger: 'blur' }], name: [{ required: true, message: '请输入大类名称', trigger: 'blur' }], drawMode: [{ required: true, message: '请选择抽题模式', trigger: 'change' }] },
      questionRules: { categoryId: [{ required: true, message: '请选择职业大类', trigger: 'change' }], careerName: [{ required: true, message: '请输入职业名称', trigger: 'blur' }], optionA: [{ required: true, message: '请输入选项 A', trigger: 'blur' }], optionB: [{ required: true, message: '请输入选项 B', trigger: 'blur' }], optionC: [{ required: true, message: '请输入选项 C', trigger: 'blur' }], optionD: [{ required: true, message: '请输入选项 D', trigger: 'blur' }], optionACareerId: [{ required: true, message: '请选择选项 A 对应职业', trigger: 'change' }], optionBCareerId: [{ required: true, message: '请选择选项 B 对应职业', trigger: 'change' }], optionCCareerId: [{ required: true, message: '请选择选项 C 对应职业', trigger: 'change' }], optionDCareerId: [{ required: true, message: '请选择选项 D 对应职业', trigger: 'change' }], correctOptionKey: [{ required: true, message: '请选择正确选项', trigger: 'change' }] }
    }
  },
  computed: {
    categoryEnabled: { get() { return String(this.categoryForm.status || '0') === '0' }, set(value) { this.categoryForm.status = value ? '0' : '1' } },
    selectedCategory() { return this.categories.find(item => String(item.categoryId) === String(this.questionForm.categoryId)) },
    careerOptions() { return this.allQuestions.length ? this.allQuestions : this.questions },
    previewOptions() { return this.optionRows.map(item => ({ key: item.key, text: this.previewQuestion && this.previewQuestion[item.text], careerId: this.previewQuestion && this.previewQuestion[item.career] })) }
  },
  created() { this.loadCategories() },
  methods: {
    handleTabClick(tab) { if (tab.name === 'questions' && !this.questions.length) this.loadQuestions() },
    drawModeText(mode) { return mode === 'random' ? '随机池，需3题' : '固定，需1题' },
    isCandidate(value) { return value === true || value === 1 || String(value) === '1' },
    loadCategories() { this.categoryLoading = true; listCategories({ pageNum: 1, pageSize: 50, gameType: 'zycck' }).then(res => { this.categories = res.rows || res.data || []; this.loadAllQuestions() }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.categoryLoading = false }) },
    loadAllQuestions() { listCareerQuestions({ pageNum: 1, pageSize: 1000, gameType: 'zycck' }).then(res => { this.allQuestions = res.rows || res.data || [] }).catch(error => this.$modal.msgError(zycckErrorMessage(error))) },
    loadQuestions() { this.questionLoading = true; listCareerQuestions({ ...this.questionQuery, gameType: 'zycck' }).then(res => { const rows = res.rows || res.data || []; this.questions = rows.map(item => ({ ...item, categoryName: item.categoryName || ((this.categories.find(category => String(category.categoryId) === String(item.categoryId)) || {}).name || '-') })); this.questionTotal = res.total || this.questions.length }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.questionLoading = false }) },
    categoryQuestionCount(category) { return category.questionCount != null ? category.questionCount : this.allQuestions.filter(item => String(item.categoryId) === String(category.categoryId)).length },
    categoryCandidateCount(category) { return category.candidateCount != null ? category.candidateCount : this.allQuestions.filter(item => String(item.categoryId) === String(category.categoryId) && this.isCandidate(item.drawCandidate)).length },
    showQuestions(category) { this.activeTab = 'questions'; this.questionQuery.categoryId = category.categoryId; this.loadQuestions() },
    preview(row) { this.previewQuestion = row; this.previewVisible = true },
    openCategoryDialog(row) { this.categoryForm = row ? { ...row } : { categoryId: null, code: '', name: '', description: '', drawMode: 'fixed', sortOrder: this.categories.length + 1, status: '0' }; this.categoryDialogVisible = true; this.$nextTick(() => this.$refs.categoryForm && this.$refs.categoryForm.clearValidate()) },
    submitCategory() { this.$refs.categoryForm.validate(valid => { if (!valid) return; this.saving = true; saveCategory({ ...this.categoryForm, gameType: 'zycck' }).then(() => { this.$modal.msgSuccess('职业大类保存成功'); this.categoryDialogVisible = false; this.loadCategories() }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.saving = false }) }) },
    openQuestionDialog(row) { this.questionForm = row ? { ...emptyQuestion(), ...row, drawCandidate: this.isCandidate(row.drawCandidate) } : emptyQuestion(); if (!this.questionForm.categoryId && this.questionQuery.categoryId) this.questionForm.categoryId = this.questionQuery.categoryId; this.questionDialogVisible = true; this.$nextTick(() => this.$refs.questionForm && this.$refs.questionForm.clearValidate()) },
    submitQuestion() { this.$refs.questionForm.validate(valid => { if (!valid) return; const category = this.selectedCategory; if (!category) return this.$modal.msgWarning('请先选择有效的职业大类'); const total = this.allQuestions.filter(item => String(item.categoryId) === String(category.categoryId) && String(item.careerQuestionId) !== String(this.questionForm.careerQuestionId)).length + 1; if (total > 10) return this.$modal.msgWarning('每个职业大类最多维护 10 个职业题目'); const optionIds = ['optionACareerId', 'optionBCareerId', 'optionCCareerId', 'optionDCareerId'].map(key => String(this.questionForm[key] || '')); if (optionIds.some(id => !id) || new Set(optionIds).size !== 4) return this.$modal.msgWarning('四个选项必须选择 4 个不同的职业'); const count = this.allQuestions.filter(item => this.isCandidate(item.drawCandidate) && String(item.categoryId) === String(category.categoryId) && String(item.careerQuestionId) !== String(this.questionForm.careerQuestionId)).length + (this.questionForm.drawCandidate ? 1 : 0); const required = category.drawMode === 'random' ? 3 : 1; if (count > required) return this.$modal.msgWarning(this.drawModeText(category.drawMode) + '，候选题不能超过 ' + required + ' 道'); this.saving = true; saveCareerQuestion({ ...this.questionForm, drawCandidate: this.questionForm.drawCandidate ? '1' : '0', gameType: 'zycck' }).then(() => { this.$modal.msgSuccess('职业题目保存成功'); this.questionDialogVisible = false; this.loadQuestions(); this.loadCategories(); this.loadAllQuestions() }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.saving = false }) }) },
    removeQuestion(row) { this.$modal.confirm('确认删除职业题目“' + row.careerName + '”吗？').then(() => deleteCareerQuestion(row.careerQuestionId)).then(() => { this.$modal.msgSuccess('删除成功'); this.loadQuestions(); this.loadCategories() }).catch(error => { if (error) this.$modal.msgError(zycckErrorMessage(error)) }) }
  }
}
</script>

<style scoped>
.page-tip { margin-bottom: 16px; }
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.toolbar-filter .el-select { width: 220px; }
.keyword { width: 240px; }
.zycck-config >>> .el-table .cell { white-space: nowrap; }
.form-tip { color: #909399; font-size: 12px; line-height: 1.4; }
.question-preview h3 { margin: 14px 0 8px; }
.preview-intro { color: #606266; }
.preview-image { display: block; width: 100%; height: 220px; margin: 12px 0; background: #f5f7fa; }
.preview-option { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; margin: 6px 0; border: 1px solid #ebeef5; border-radius: 4px; }
</style>
