<template>
  <div class="app-container">
    <el-card v-loading="loading" class="setting-card">
      <div slot="header">
        <span>天平规则参数</span>
        <span class="header-tip">修改后对新的称重生效，已提交记录保留原结果</span>
      </div>
      <el-form :model="setting" :inline="true" size="small" label-width="120px">
        <el-form-item label="左侧标准砝码">
          <el-input-number v-model="setting.leftWeightG" :min="1" :max="1000" :step="5" />
          <span class="unit">g</span>
        </el-form-item>
        <el-form-item label="通关阈值">
          <el-input-number v-model="setting.passWeightG" :min="1" :max="1000" :step="5" />
          <span class="unit">g</span>
        </el-form-item>
        <el-form-item label="称重限时">
          <el-input-number v-model="setting.timeLimitSeconds" :min="0" :max="3600" :step="30" />
          <span class="unit">秒，0 表示不限时</span>
        </el-form-item>
        <el-form-item label="允许重新称重">
          <el-switch v-model="setting.allowRetry" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="启用游戏">
          <el-switch v-model="setting.enabled" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="savingSetting" @click="submitSetting">保存规则参数</el-button>
        </el-form-item>
      </el-form>
      <div class="rule-tip">
        左盘固定为标准砝码，右盘为 20 个砝码中勾选的重量之和；总重达到通关阈值即通关，
        恰好等于阈值显示“刚好达标”。未通关时按重量从大到小推荐尚未勾选的砝码。
      </div>
    </el-card>

    <el-card class="weight-card">
      <div slot="header">
        <span>20 个砝码配置</span>
        <span class="header-tip">挂钩号固定为 1-20；停用砝码不出现在学生端且不计分</span>
      </div>
      <el-table v-loading="loading" :data="weights" border stripe>
        <el-table-column prop="weightNo" label="挂钩号" width="80" align="center" />
        <el-table-column prop="categoryName" label="类别" min-width="170" align="center" />
        <el-table-column label="砝码" min-width="150" align="center">
          <template slot-scope="scope">
            <span class="weight-icon">{{ scope.row.icon }}</span>
            <span>{{ scope.row.label }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weightG" label="重量" width="80" align="center">
          <template slot-scope="scope">{{ scope.row.weightG }}g</template>
        </el-table-column>
        <el-table-column prop="conditionText" label="学生自查标准" min-width="320" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">
              {{ scope.row.status === '0' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="editWeight(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="编辑砝码" :visible.sync="dialogVisible" width="600px" @close="resetForm">
      <el-form ref="form" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="挂钩号">
          <el-input :value="form.weightNo" disabled />
        </el-form-item>
        <el-form-item label="大类" prop="categoryCode">
          <el-select v-model="form.categoryCode" style="width: 100%" @change="categoryChanged">
            <el-option
              v-for="item in categories"
              :key="item.code"
              :label="item.name"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="砝码标签" prop="label">
          <el-input v-model.trim="form.label" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="图标字符">
          <el-input v-model.trim="form.icon" maxlength="8" placeholder="例如 🎯，可留空" />
        </el-form-item>
        <el-form-item label="砝码图片">
          <ImageUpload v-model="form.imageUrl" :limit="1" :file-size="2" :is-show-tip="false" />
          <div class="form-tip">可选，设置后学生端优先显示图片；不设置时显示图标字符</div>
        </el-form-item>
        <el-form-item label="重量" prop="weightG">
          <el-input-number v-model="form.weightG" :min="1" :max="100" :step="5" />
          <span class="unit">g</span>
        </el-form-item>
        <el-form-item label="自查标准" prop="conditionText">
          <el-input
            v-model="form.conditionText"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="学生对照简历判断是否具备该砝码的说明"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitWeight">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getConfig, saveWeight, saveSetting, jlczErrorMessage } from '@/api/jlcz'
import ImageUpload from '@/components/ImageUpload'

export default {
  name: 'JlczConfig',
  components: { ImageUpload },
  data() {
    return {
      loading: false,
      saving: false,
      savingSetting: false,
      dialogVisible: false,
      weights: [],
      setting: {
        leftWeightG: 80,
        passWeightG: 80,
        timeLimitSeconds: 0,
        allowRetry: '1',
        enabled: '1',
      },
      form: {},
      categories: [
        { code: 'core', name: '硬通货（核心竞争力）' },
        { code: 'soft', name: '软实力（发展潜力）' },
        { code: 'basic', name: '基本功（职业素养）' },
        { code: 'bonus', name: '加分项（额外亮点）' },
      ],
      rules: {
        categoryCode: [{ required: true, message: '请选择大类', trigger: 'change' }],
        label: [{ required: true, message: '请填写砝码标签', trigger: 'blur' }],
        weightG: [{ required: true, message: '请填写砝码重量', trigger: 'blur' }],
      },
    }
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
          this.weights = data.weights || []
          if (data.setting) {
            this.setting = {
              leftWeightG: data.setting.leftWeightG,
              passWeightG: data.setting.passWeightG,
              timeLimitSeconds: data.setting.timeLimitSeconds,
              allowRetry: data.setting.allowRetry || '1',
              enabled: data.setting.enabled || '1',
            }
          }
        })
        .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    submitSetting() {
      this.savingSetting = true
      saveSetting({ ...this.setting })
        .then(() => {
          this.$modal.msgSuccess('规则参数已保存')
          this.load()
        })
        .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
        .finally(() => {
          this.savingSetting = false
        })
    },
    editWeight(row) {
      this.form = { ...row }
      this.dialogVisible = true
    },
    categoryChanged(code) {
      const item = this.categories.find((category) => category.code === code)
      this.form.categoryName = item ? item.name : ''
    },
    submitWeight() {
      this.$refs.form.validate((valid) => {
        if (!valid) return
        this.saving = true
        saveWeight(this.form.weightNo, { ...this.form })
          .then(() => {
            this.$modal.msgSuccess('砝码已保存')
            this.dialogVisible = false
            this.load()
          })
          .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
          .finally(() => {
            this.saving = false
          })
      })
    },
    resetForm() {
      this.form = {}
      if (this.$refs.form) this.$refs.form.clearValidate()
    },
  },
}
</script>

<style scoped>
.setting-card {
  margin-bottom: 16px;
}
.header-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}
.unit {
  margin-left: 6px;
  color: #909399;
}
.weight-icon {
  margin-right: 6px;
}
.rule-tip {
  padding: 10px 12px;
  background: #f4f8ff;
  border-radius: 4px;
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
}
.form-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}
</style>
