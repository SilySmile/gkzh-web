<template>
  <div class="app-container">
    <el-card v-loading="loading" class="setting-card">
      <div slot="header">
        <span>规则参数</span>
        <span class="header-tip">修改后对新进入的学生生效，已确认的记录保留原选择卡文案</span>
      </div>
      <el-form :model="setting" :inline="true" size="small" label-width="130px">
        <el-form-item label="允许重新选择">
          <el-switch v-model="setting.allowReselect" active-value="1" inactive-value="0" />
          <span class="unit">关闭时学生确认后即只读</span>
        </el-form-item>
        <el-form-item label="启用游戏">
          <el-switch v-model="setting.enabled" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="savingSetting" @click="submitSetting">保存规则参数</el-button>
        </el-form-item>
      </el-form>
      <div class="rule-tip">
        学生在“职面未来”页面从 8 个未来发展方向中选择一条并确认，服务端写入方向、标签、方向解读和寄语快照，
        生成个人未来选择卡。方向名称、标签、文案与图标均可在此维护；方向编码用于历史统计，创建后不可修改。
      </div>
    </el-card>

    <el-card class="direction-card">
      <div slot="header">
        <span>8 个未来发展方向</span>
        <span class="header-tip">停用的方向不出现在学生端，也不能被选择；历史记录仍按快照展示</span>
      </div>
      <el-table v-loading="loading" :data="directions" border stripe>
        <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
        <el-table-column label="图标" width="80" align="center">
          <template slot-scope="scope">
            <el-image
              v-if="scope.row.iconUrl"
              :src="resolveUrl(scope.row.iconUrl)"
              :preview-src-list="[resolveUrl(scope.row.iconUrl)]"
              fit="contain"
              class="direction-icon"
            />
            <span v-else class="direction-icon-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="发展方向" min-width="130" align="center" />
        <el-table-column prop="directionCode" label="方向编码" min-width="140" align="center" />
        <el-table-column prop="tagName" label="标签称号" min-width="130" align="center" />
        <el-table-column prop="shortIntro" label="简短介绍" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">
              {{ scope.row.status === '0' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="editDirection(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="编辑未来发展方向" :visible.sync="dialogVisible" width="680px" @close="resetForm">
      <el-form ref="form" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="方向编码">
          <el-input :value="form.directionCode" disabled />
          <div class="form-tip">用于历史记录快照与统计，创建后不可修改</div>
        </el-form-item>
        <el-form-item label="发展方向" prop="name">
          <el-input v-model.trim="form.name" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="标签称号" prop="tagName">
          <el-input v-model.trim="form.tagName" maxlength="20" show-word-limit placeholder="例如 职场启航者" />
        </el-form-item>
        <el-form-item label="简短介绍" prop="shortIntro">
          <el-input v-model.trim="form.shortIntro" maxlength="60" show-word-limit placeholder="选项卡片上的一句话介绍" />
        </el-form-item>
        <el-form-item label="方向解读" prop="interpretation">
          <el-input
            v-model="form.interpretation"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="个人选择卡“方向解读”区域展示的文案"
          />
        </el-form-item>
        <el-form-item label="寄语" prop="message">
          <el-input
            v-model="form.message"
            type="textarea"
            :rows="3"
            maxlength="300"
            show-word-limit
            placeholder="个人选择卡“寄语”区域展示的文案"
          />
        </el-form-item>
        <el-form-item label="方向图标">
          <ImageUpload v-model="form.iconUrl" :limit="1" :file-size="2" :is-show-tip="false" />
          <div class="form-tip">建议 PNG 透明底，宽度 300rpx 左右；不设置时学生端使用内置兜底图标</div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="1" :max="999" />
          <span class="unit">数值越小越靠前</span>
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
        <el-button type="primary" :loading="saving" @click="submitDirection">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getConfig, saveDirection, saveSetting, zmwlErrorMessage } from '@/api/zmwl'
import ImageUpload from '@/components/ImageUpload'

export default {
  name: 'ZmwlConfig',
  components: { ImageUpload },
  data() {
    return {
      loading: false,
      saving: false,
      savingSetting: false,
      dialogVisible: false,
      directions: [],
      setting: {
        allowReselect: '0',
        enabled: '1',
      },
      form: {},
      rules: {
        name: [{ required: true, message: '请填写发展方向名称', trigger: 'blur' }],
      },
    }
  },
  created() {
    this.load()
  },
  methods: {
    /** 后台保存的是相对路径时补全为可访问地址。 */
    resolveUrl(url) {
      if (!url || /^https?:\/\//i.test(url)) return url
      const base = process.env.VUE_APP_BASE_API || ''
      return base + (url.indexOf('/') === 0 ? url : '/' + url)
    },
    load() {
      this.loading = true
      getConfig()
        .then((res) => {
          const data = res.data || {}
          this.directions = data.directions || []
          if (data.setting) {
            this.setting = {
              allowReselect: data.setting.allowReselect || '0',
              enabled: data.setting.enabled || '1',
            }
          }
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
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
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
        .finally(() => {
          this.savingSetting = false
        })
    },
    editDirection(row) {
      this.form = { ...row }
      this.dialogVisible = true
    },
    submitDirection() {
      this.$refs.form.validate((valid) => {
        if (!valid) return
        this.saving = true
        saveDirection(this.form.directionId, { ...this.form })
          .then(() => {
            this.$modal.msgSuccess('发展方向已保存')
            this.dialogVisible = false
            this.load()
          })
          .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
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
.rule-tip {
  padding: 10px 12px;
  background: #f4f8ff;
  border-radius: 4px;
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
}
.direction-icon {
  width: 44px;
  height: 44px;
}
.direction-icon-empty {
  color: #c0c4cc;
}
.form-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}
</style>
