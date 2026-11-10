<template>
  <div class="app-container">
    <el-card class="setting-card">
      <div slot="header"><span>规则参数</span></div>
      <el-form :inline="true" size="small">
        <el-form-item label="单局限时">
          <el-input-number v-model="setting.timeLimit" :min="0" :max="300" :step="5" />
          <span class="tip">秒；填 0 表示不限时</span>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="setting.enabled" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-button type="primary" size="small" :loading="savingSetting" @click="submitSetting">保存</el-button>
      </el-form>
    </el-card>

    <el-card class="career-card">
      <div slot="header">
        <span>岗位与四维卡片</span>
        <span class="tip">共 {{ careers.length }} 套岗位；每套固定工作内容、核心技能、职业缺点、发展前景四张卡片</span>
      </div>
      <el-table :data="careers" border size="mini">
        <el-table-column label="排序" prop="career.sortOrder" width="70" align="center" />
        <el-table-column label="岗位编码" prop="career.careerCode" min-width="220" />
        <el-table-column label="岗位名称" prop="career.careerName" min-width="180" />
        <el-table-column label="卡片数" width="90" align="center">
          <template slot-scope="scope">{{ (scope.row.cards || []).length }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.career.status === '0'" type="success" size="mini">启用</el-tag>
            <el-tag v-else type="info" size="mini">停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="'编辑岗位：' + (form.careerName || '')" :visible.sync="dialogVisible" width="860px" append-to-body>
      <el-form :model="form" label-width="100px" size="small">
        <el-form-item label="岗位名称">
          <el-input v-model.trim="form.careerName" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="岗位定义">
          <el-input v-model="form.intro" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="行业价值">
          <el-input v-model="form.industryValue" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="新生入门建议">
          <el-input v-model="form.newcomerAdvice" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 140px">
            <el-option label="启用" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">四维卡片（维度固定，只能改文案与启停用）</el-divider>
      <el-table :data="cardForms" border size="mini">
        <el-table-column label="维度" width="110" align="center">
          <template slot-scope="scope">{{ slotName(scope.row.dimensionCode) }}</template>
        </el-table-column>
        <el-table-column label="卡片正文" min-width="420">
          <template slot-scope="scope">
            <el-input v-model="scope.row.cardText" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" maxlength="800" show-word-limit />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template slot-scope="scope">
            <el-select v-model="scope.row.status" size="mini">
              <el-option label="启用" value="0" />
              <el-option label="停用" value="1" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>

      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getConfig, saveCareer, saveCard, saveSetting, zdypErrorMessage } from '@/api/zdyp'

export default {
  name: 'ZdypConfig',
  data() {
    return {
      setting: { timeLimit: 45, enabled: '1' },
      slots: [],
      careers: [],
      savingSetting: false,
      dialogVisible: false,
      saving: false,
      form: {},
      cardForms: []
    }
  },
  created() {
    this.load()
  },
  methods: {
    load() {
      getConfig()
        .then((res) => {
          const data = res.data || {}
          this.setting = data.setting || { timeLimit: 45, enabled: '1' }
          this.slots = data.slots || []
          this.careers = data.careers || []
        })
        .catch((error) => this.$modal.msgError(zdypErrorMessage(error)))
    },
    slotName(code) {
      const item = this.slots.find((slot) => slot.slotCode === code)
      if (item) return item.slotName
      const fallback = { content: '工作内容', skill: '核心技能', weakness: '职业缺点', prospect: '发展前景' }
      return fallback[code] || code
    },
    submitSetting() {
      this.savingSetting = true
      saveSetting({ timeLimit: this.setting.timeLimit, enabled: this.setting.enabled })
        .then(() => {
          this.$modal.msgSuccess('规则参数已保存')
          this.load()
        })
        .catch((error) => this.$modal.msgError(zdypErrorMessage(error)))
        .finally(() => {
          this.savingSetting = false
        })
    },
    openEdit(row) {
      this.form = { ...row.career }
      // 复制一份卡片，取消编辑时不影响列表数据。
      this.cardForms = (row.cards || []).map((card) => ({ ...card }))
      this.dialogVisible = true
    },
    submitEdit() {
      if (!this.form.careerName) {
        this.$modal.msgWarning('请填写岗位名称')
        return
      }
      if (this.cardForms.some((card) => !card.cardText || !card.cardText.trim())) {
        this.$modal.msgWarning('四张卡片的内容都不能为空')
        return
      }
      this.saving = true
      saveCareer(this.form.careerId, this.form)
        .then(() => Promise.all(this.cardForms.map((card) =>
          saveCard(card.cardId, { cardText: card.cardText, sortOrder: card.sortOrder, status: card.status }))))
        .then(() => {
          this.$modal.msgSuccess('岗位与卡片已保存')
          this.dialogVisible = false
          this.load()
        })
        .catch((error) => this.$modal.msgError(zdypErrorMessage(error)))
        .finally(() => {
          this.saving = false
        })
    }
  }
}
</script>

<style scoped>
.setting-card {
  margin-bottom: 16px;
}
.tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
