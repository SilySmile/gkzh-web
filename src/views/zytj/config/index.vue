<template>
  <div class="app-container">
    <el-card v-loading="loading" class="setting-card">
      <div slot="header">
        <span>规则参数</span>
        <span class="header-tip">修改后对新进入的学生生效，已生成的职业探索卡保留原文案快照</span>
      </div>
      <el-form :model="setting" :inline="true" size="small" label-width="130px">
        <el-form-item label="单局限时（秒）">
          <el-input-number v-model="setting.timeLimit" :min="0" :max="600" :step="5" />
          <span class="unit">0 表示不限时；需求口径为 30 秒</span>
        </el-form-item>
        <el-form-item label="允许重新探究">
          <el-switch v-model="setting.allowReselect" active-value="1" inactive-value="0" />
          <span class="unit">关闭时提交后即只读</span>
        </el-form-item>
        <el-form-item label="启用游戏">
          <el-switch v-model="setting.enabled" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="savingSetting" @click="submitSetting">保存规则参数</el-button>
        </el-form-item>
      </el-form>
      <div class="rule-tip">
        学生在 30 秒内从四列橱窗中各选 1 件物品，按列序生成四位人格类型代码，并生成职业探索卡。
        第 1 列对应外向(E)/内向(I)，第 2 列实感(S)/直觉(N)，第 3 列思考(T)/情感(F)，第 4 列判断(J)/感知(P)。
        到点未选满时，服务端会按该列第一个启用物品补全并标记超时，保证每名学生都能拿到卡片。
      </div>
    </el-card>

    <el-card class="item-card">
      <div slot="header">
        <span>8 个橱窗物品</span>
        <span class="header-tip">2 行 4 列；物品编码即维度字母，用于记录快照和统计，创建后不可修改</span>
      </div>
      <el-table v-loading="loading" :data="items" border stripe>
        <el-table-column prop="columnIndex" label="列" width="60" align="center" />
        <el-table-column prop="rowIndex" label="行" width="60" align="center" />
        <el-table-column label="维度" width="130" align="center">
          <template slot-scope="scope">{{ dimensionText(scope.row.dimensionCode) }}</template>
        </el-table-column>
        <el-table-column prop="itemCode" label="编码" width="70" align="center" />
        <el-table-column label="图片" width="90" align="center">
          <template slot-scope="scope">
            <el-image
              v-if="scope.row.imageUrl"
              :src="resolveUrl(scope.row.imageUrl)"
              :preview-src-list="[resolveUrl(scope.row.imageUrl)]"
              fit="contain"
              class="item-image"
            />
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="itemName" label="物品名称" min-width="140" align="center" />
        <el-table-column prop="metaphor" label="隐喻说明" min-width="300" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">
              {{ scope.row.status === '0' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="editItem(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="type-card">
      <div slot="header">
        <span>16 型人格对照</span>
        <span class="header-tip">学生提交时写入快照；此处修改只影响之后生成的职业探索卡</span>
      </div>
      <el-table v-loading="loading" :data="types" border stripe>
        <el-table-column prop="typeCode" label="人格类型" width="100" align="center" />
        <el-table-column prop="feature" label="性格特点" min-width="240" show-overflow-tooltip />
        <el-table-column prop="careerField" label="适合职业领域" min-width="200" show-overflow-tooltip />
        <el-table-column prop="typicalCareers" label="典型职业" min-width="240" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">
              {{ scope.row.status === '0' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="editType(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="编辑橱窗物品" :visible.sync="itemDialogVisible" width="620px" @close="resetItemForm">
      <el-form ref="itemForm" :model="itemForm" :rules="itemRules" label-width="110px">
        <el-form-item label="物品编码">
          <el-input :value="itemForm.itemCode" disabled />
          <div class="form-tip">即维度字母，用于记录快照与统计，创建后不可修改</div>
        </el-form-item>
        <el-form-item label="所属列">
          <el-input :value="`第 ${itemForm.columnIndex} 列 / 第 ${itemForm.rowIndex} 行`" disabled />
        </el-form-item>
        <el-form-item label="物品名称" prop="itemName">
          <el-input v-model.trim="itemForm.itemName" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="物品图片">
          <ImageUpload v-model="itemForm.imageUrl" :limit="1" :file-size="2" :is-show-tip="false" />
          <div class="form-tip">建议正方形透明底或圆角图，宽度 300rpx 左右</div>
        </el-form-item>
        <el-form-item label="隐喻说明">
          <el-input
            v-model="itemForm.metaphor"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="解释该物品为什么代表这个性格维度"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sortOrder" :min="0" :max="999" />
          <span class="unit">同列内数值越小越靠前</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="itemForm.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingItem" @click="submitItem">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog title="编辑人格类型文案" :visible.sync="typeDialogVisible" width="620px" @close="resetTypeForm">
      <el-form ref="typeForm" :model="typeForm" label-width="110px">
        <el-form-item label="人格类型">
          <el-input :value="typeForm.typeCode" disabled />
          <div class="form-tip">四位代码由四列所选物品的维度字母按列序拼成，创建后不可修改</div>
        </el-form-item>
        <el-form-item label="性格特点">
          <el-input v-model="typeForm.feature" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="适合职业领域">
          <el-input v-model="typeForm.careerField" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="典型职业">
          <el-input v-model="typeForm.typicalCareers" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="typeForm.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="typeForm.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingType" @click="submitType">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getConfig, saveItem, saveType, saveSetting, zytjErrorMessage } from '@/api/zytj'
import ImageUpload from '@/components/ImageUpload'

export default {
  name: 'ZytjConfig',
  components: { ImageUpload },
  data() {
    return {
      loading: false,
      savingSetting: false,
      savingItem: false,
      savingType: false,
      items: [],
      types: [],
      setting: { timeLimit: 30, allowReselect: '0', enabled: '1' },
      itemDialogVisible: false,
      itemForm: {},
      itemRules: {
        itemName: [{ required: true, message: '请填写物品名称', trigger: 'blur' }],
      },
      typeDialogVisible: false,
      typeForm: {},
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
    dimensionText(code) {
      const map = { EI: '外向/内向', SN: '实感/直觉', TF: '思考/情感', JP: '判断/感知' }
      return map[code] || code || '-'
    },
    load() {
      this.loading = true
      getConfig()
        .then((res) => {
          const data = res.data || {}
          this.items = data.items || []
          this.types = data.types || []
          if (data.setting) {
            this.setting = {
              timeLimit: data.setting.timeLimit == null ? 30 : data.setting.timeLimit,
              allowReselect: data.setting.allowReselect || '0',
              enabled: data.setting.enabled || '1',
            }
          }
        })
        .catch((error) => this.$modal.msgError(zytjErrorMessage(error)))
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
        .catch((error) => this.$modal.msgError(zytjErrorMessage(error)))
        .finally(() => {
          this.savingSetting = false
        })
    },
    editItem(row) {
      this.itemForm = { ...row }
      this.itemDialogVisible = true
    },
    submitItem() {
      this.$refs.itemForm.validate((valid) => {
        if (!valid) return
        this.savingItem = true
        saveItem(this.itemForm.itemId, { ...this.itemForm })
          .then(() => {
            this.$modal.msgSuccess('物品已保存')
            this.itemDialogVisible = false
            this.load()
          })
          .catch((error) => this.$modal.msgError(zytjErrorMessage(error)))
          .finally(() => {
            this.savingItem = false
          })
      })
    },
    resetItemForm() {
      this.itemForm = {}
      if (this.$refs.itemForm) this.$refs.itemForm.clearValidate()
    },
    editType(row) {
      this.typeForm = { ...row }
      this.typeDialogVisible = true
    },
    submitType() {
      this.savingType = true
      saveType(this.typeForm.typeId, { ...this.typeForm })
        .then(() => {
          this.$modal.msgSuccess('人格类型文案已保存')
          this.typeDialogVisible = false
          this.load()
        })
        .catch((error) => this.$modal.msgError(zytjErrorMessage(error)))
        .finally(() => {
          this.savingType = false
        })
    },
    resetTypeForm() {
      this.typeForm = {}
    },
  },
}
</script>

<style scoped>
.setting-card,
.item-card {
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
.item-image {
  width: 48px;
  height: 42px;
}
.muted {
  color: #c0c4cc;
}
.form-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}
</style>
