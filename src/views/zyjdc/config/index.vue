<template>
  <div class="app-container">
    <el-alert
      title="职业角斗场固定 8 个动物角色，编码和对弈等级由游戏规则决定，不能修改；可维护角色名称、职场定位、头像和展示文案。头像建议使用透明底 PNG，上传后小程序和活动查看页会同步使用。"
      type="info"
      :closable="false"
      class="tip"
    />

    <el-table v-loading="loading" :data="roles" border stripe>
      <el-table-column label="头像" width="90" align="center">
        <template slot-scope="scope">
          <el-image
            v-if="scope.row.imageUrl"
            :src="scope.row.imageUrl"
            :preview-src-list="[scope.row.imageUrl]"
            fit="contain"
            class="role-image"
          />
          <span v-else class="empty-text">未上传</span>
        </template>
      </el-table-column>
      <el-table-column prop="roleName" label="动物角色" width="100" align="center" />
      <el-table-column prop="roleCode" label="编码" width="110" align="center" />
      <el-table-column prop="jobTitle" label="职场定位" min-width="170" />
      <el-table-column prop="rankLevel" label="等级" width="80" align="center" />
      <el-table-column prop="survivalRule" label="生存法则" min-width="280" show-overflow-tooltip />
      <el-table-column prop="careerAbility" label="职场能力" min-width="280" show-overflow-tooltip />
      <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openEdit(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="'编辑角色：' + (form.roleName || '')" :visible.sync="dialogVisible" width="720px" append-to-body>
      <el-form ref="roleForm" :model="form" :rules="rules" label-width="110px" size="small">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="动物角色" prop="roleName">
              <el-input v-model.trim="form.roleName" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职场定位" prop="jobTitle">
              <el-input v-model.trim="form.jobTitle" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="角色编码">
              <el-input :value="form.roleCode" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对弈等级">
              <el-input :value="form.rankLevel" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="角色头像">
          <ImageUpload v-model="form.imageUrl" :limit="1" :file-size="2" />
        </el-form-item>
        <el-form-item label="角色解读">
          <el-input v-model="form.roleInterpretation" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="生存法则">
          <el-input v-model="form.survivalRule" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="职场能力">
          <el-input v-model="form.careerAbility" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="职场定位说明">
          <el-input v-model="form.positioning" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="能力优势">
          <el-input v-model="form.advantage" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" :max="999" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio label="0">启用</el-radio>
                <el-radio label="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submit">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import ImageUpload from '@/components/ImageUpload'
import { listRoles, saveRole, zyjdcErrorMessage } from '@/api/zyjdc'

export default {
  name: 'ZyjdcConfig',
  components: { ImageUpload },
  data() {
    return {
      loading: false,
      saving: false,
      dialogVisible: false,
      roles: [],
      form: {},
      rules: {
        roleName: [{ required: true, message: '请输入动物角色名称', trigger: 'blur' }],
        jobTitle: [{ required: true, message: '请输入职场定位', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.load()
  },
  methods: {
    load() {
      this.loading = true
      listRoles()
        .then(res => {
          this.roles = res.data || []
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    openEdit(row) {
      this.form = Object.assign({}, row)
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.roleForm && this.$refs.roleForm.clearValidate())
    },
    submit() {
      this.$refs.roleForm.validate(valid => {
        if (!valid || this.saving) return
        this.saving = true
        saveRole(this.form.roleId, this.form)
          .then(() => {
            this.$modal.msgSuccess('角色配置已保存')
            this.dialogVisible = false
            this.load()
          })
          .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
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
.role-image {
  width: 56px;
  height: 56px;
  vertical-align: middle;
}
.empty-text {
  color: #909399;
  font-size: 12px;
}
</style>
