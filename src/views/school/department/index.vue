<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="名称" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable>
          <el-option label="正常" value="0" />
          <el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="el-icon-upload2" size="mini" @click="handleImport" v-hasPermi="['school:department:import']">院系导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-sort"
          size="mini"
          @click="toggleExpandAll"
        >展开/折叠</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="departmentList"
      row-key="departmentId"
      :default-expand-all="isExpandAll"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column prop="title" label="名称" :show-overflow-tooltip="true" width="300"></el-table-column>
      <el-table-column prop="sortNum" label="排序" width="60"></el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === '0'" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" :show-overflow-tooltip="true"></el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <template v-if="scope.row.departmentId === -1">

          </template>
          <template v-else>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
            >修改</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-plus"
              @click="handleAdd(scope.row)"
            >新增</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改部门对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="上级" prop="parentId">
          <treeselect
            v-model="form.parentId"
            :options="departmentOptions"
            :normalizer="normalizer"
            :show-count="true"
            placeholder="选择上级"
          />
        </el-form-item>
        <el-form-item label="名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sortNum">
          <el-input-number v-model="form.sortNum" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="open=false">取 消</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="upload.title" :visible.sync="upload.open" width="400px" append-to-body>
      <el-upload ref="upload" :limit="1" accept=".xlsx, .xls" :headers="upload.headers" :action="upload.url + '?updateSupport=' + upload.updateSupport" :disabled="upload.isUploading" :on-progress="handleFileUploadProgress" :on-success="handleFileSuccess" :auto-upload="false" drag>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip text-center" slot="tip">
          <div class="el-upload__tip" slot="tip">
            <el-checkbox v-model="upload.updateSupport" />是否更新已经存在的数据
          </div>
          <span>仅允许导入xls、xlsx格式文件。</span>
          <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="upload.open = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getDepartmentTree, addDepartment, updateDepartment, delDepartment } from '@/api/school/department'
import Treeselect from "@riophae/vue-treeselect"
import "@riophae/vue-treeselect/dist/vue-treeselect.css"
import { getSchool } from "@/api/school/school"
import {getToken} from "@/utils/auth";

export default {
  name: 'SchoolDepartment',
  components: {Treeselect},
  data() {
    return {
      queryParams: { title: '', status: '' },
      showSearch: true,
      loading: false,
      refreshTable: true,
      isExpandAll: true,
      schoolId: this.$route.params.schoolId || null,
      schoolList: [],
      departmentList: [],
      departmentOptions: [],
      open: false,
      title: '',
      form: {},
      rules: {
        title: [ { required: true, message: '名称不能为空', trigger: 'blur' } ]
      },
      menu:{departmentId:-1,title:'定义',status:'0',children:[]},
      /*导入参数*/
      upload: {
        // 是否显示弹出层
        open: false,
        // 弹出层标题
        title: "",
        // 是否禁用上传
        isUploading: false,
        // 是否更新已经存在的用户数据
        updateSupport: 0,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: process.env.VUE_APP_BASE_API + "/school/department/importData"
      },

    }
  },
  created() {
    this.getList()
  },
  methods: {

    getList() {
      if (!this.schoolId) return
      this.loading = true
      getSchool(this.schoolId).then(res=>{
        this.menu.title = res.data.title
      })
      getDepartmentTree(this.schoolId).then(res => {
        this.departmentList = []
        console.log(res);
        this.menu.children = this.handleTree(res.data,"departmentId")
        this.departmentList.push(this.menu)
        this.departmentOptions = this.departmentList
        this.loading = false
      })
    },
    /** 转换菜单数据结构 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children
      }
      return {
        id: node.departmentId,
        label: node.title,
        children: node.children
      }
    },

    listToTree(list) {
      const map = {}, roots = []
      list.forEach(item => { map[item.departmentId] = { ...item, children: [] } })
      list.forEach(item => {
        if (item.parentId && map[item.parentId]) {
          map[item.parentId].children.push(map[item.departmentId])
        } else {
          roots.push(map[item.departmentId])
        }
      })
      return roots
    },
    handleQuery() {
      this.getList()
    },
    resetQuery() {
      this.queryParams = { title: '', status: '' }
      this.getList()
    },
    toggleExpandAll() {
      this.isExpandAll = !this.isExpandAll
      this.refreshTable = false
      this.$nextTick(() => { this.refreshTable = true })
    },
    handleAdd(row) {
      console.log(row);
      this.title = '新增'
      this.form = {
        schoolId: this.schoolId,
        parentId: row.departmentId ? row.departmentId : -1,
        title: '',
        sortNum: 0,
        status: '0',
        remark: ''
      }
      this.open = true
    },
    handleUpdate(row) {
      this.title = '修改'

      this.form = { ...row }
      this.form.parentId = row.parentId ? row.parentId : -1
      this.open = true
    },
    handleDelete(row) {
      this.$confirm('确定删除该部门吗？').then(() => {
        delDepartment(row.departmentId).then(() => {
          this.$message.success('删除成功')
          this.getList()
        })
      })
    },
    /** 导入按钮操作 */
    handleImport() {
      this.upload.title = "导入院系信息"
      this.upload.open = true
    },
    /** 下载模板操作 */
    importTemplate() {
      this.download('school/department/importTemplate', {
      }, `院系信息模板.xlsx`)
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.open = false
      this.upload.isUploading = false
      this.$refs.upload.clearFiles()
      this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true })
      this.getList()
    },
    // 提交上传文件
    submitFileForm() {
      this.$refs.upload.submit()
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          if (this.form.departmentId) {
            updateDepartment(this.form).then(() => {
              this.$message.success('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addDepartment(this.form).then(() => {
              this.$message.success('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    }
  }
}
</script>
