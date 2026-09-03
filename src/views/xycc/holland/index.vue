<template>
  <div class="app-container">
    <el-row class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-plus" size="mini" @click="openDialog">新增编码解释</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="codeList" border>
      <el-table-column label="编码" prop="code" width="90" />
      <el-table-column label="类型名称" prop="name" width="120" />
      <el-table-column label="英文名称" prop="fullName" width="140" />
      <el-table-column label="特点" prop="summary" show-overflow-tooltip />
      <el-table-column label="生活事例" prop="life" show-overflow-tooltip />
      <el-table-column label="操作" width="140">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="openDialog(scope.row)">编辑</el-button>
          <el-button type="text" size="mini" @click="removeCode(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="form.code && existed ? '编辑编码解释' : '新增编码解释'" :visible.sync="dialogVisible" width="700px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="编码"><el-input v-model="form.code" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="类型名称"><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="英文名称"><el-input v-model="form.fullName" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="特点"><el-input v-model="form.summary" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="核心特点"><el-input v-model="form.traits" /></el-form-item>
        <el-form-item label="生活事例"><el-input v-model="form.life" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="典型工作"><el-input v-model="form.work" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCode">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listHollandCodes, saveHollandCode, delHollandCode } from '@/api/xycc/holland'

export default {
  name: 'HollandCode',
  data() {
    return {
      loading: false,
      codeList: [],
      dialogVisible: false,
      form: {},
      existed: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listHollandCodes().then(res => {
        this.codeList = res.data || []
        this.loading = false
      })
    },
    openDialog(row) {
      this.existed = !!row
      this.form = row ? { ...row } : {
        code: '',
        name: '',
        fullName: '',
        summary: '',
        traits: '',
        life: '',
        work: '',
        sortOrder: (this.codeList.length || 0) + 1,
        status: '0'
      }
      this.dialogVisible = true
    },
    submitCode() {
      saveHollandCode(this.form).then(() => {
        this.$message.success('保存成功')
        this.dialogVisible = false
        this.getList()
      })
    },
    removeCode(row) {
      this.$confirm('确认删除该编码解释？', '提示').then(() => {
        delHollandCode(row.code).then(() => {
          this.$message.success('删除成功')
          this.getList()
        })
      }).catch(() => {})
    }
  }
}
</script>
