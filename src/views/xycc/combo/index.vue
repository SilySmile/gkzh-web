<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="组合编码" prop="code">
        <el-input
          style="width: 200px"
          v-model="queryParams.code"
          placeholder='请输入组合编码，如"RIA"'
          clearable
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['xycc:combo:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['xycc:combo:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['xycc:combo:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['xycc:combo:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="comboList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="patternComboId" />
      <el-table-column label="组合编码" align="center" prop="code" />
      <el-table-column label="职业方向" align="center" prop="careerTitles" :show-overflow-tooltip="true" />
      <el-table-column label="工作环境偏好" align="center" prop="envTitles" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['xycc:combo:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['xycc:combo:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改编码组合对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="组合编码" prop="code">
          <el-input v-model="form.code" placeholder='请输入组合编码，如"RIA"' />
        </el-form-item>
        <el-form-item label="职业方向">
          <el-select v-model="form.careerIds" multiple filterable placeholder="请选择职业方向">
            <el-option v-for="item in careerOptions" :key="item.careerId" :label="item.title" :value="item.careerId"  ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="工作环境偏好">
          <el-select v-model="form.envIds" multiple filterable placeholder="请选择工作环境偏好">
            <el-option v-for="item in envOptions" :key="item.workEnvId" :label="item.title" :value="item.workEnvId"  ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listCombo, getCombo, delCombo, addCombo, updateCombo } from "@/api/xycc/combo"
import { listCareer } from "@/api/xycc/career"
import { listEnv } from "@/api/xycc/env";

export default {
  name: "Combo",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 编码组合表格数据
      comboList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        orderByColumn: "patternComboId",
        isAsc: "desc"
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      },
      careerOptions:[],
      envOptions:[]
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询编码组合列表 */
    getList() {
      this.loading = true
      listCombo(this.queryParams).then(response => {
        this.comboList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        patternComboId: null,
        code: null
      }
      this.resetForm("form")
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.patternComboId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加编码组合"
      listCareer({orderByColumn:"careerId",isAsc:"desc",startPage:1,pageSize:1000}).then(response => {
        this.careerOptions = response.rows
      })
      listEnv({orderByColumn:"workEnvId",isAsc:"desc",startPage:1,pageSize:1000}).then(response => {
        this.envOptions = response.rows
      })

    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const patternComboId = row.patternComboId || this.ids
      Promise.all([
        getCombo(patternComboId),
        listCareer({orderByColumn:"careerId",isAsc:"desc",startPage:1,pageSize:1000}),
        listEnv({orderByColumn:"workEnvId",isAsc:"desc",startPage:1,pageSize:1000})
      ]).then(([comboRes, careerRes, envRes]) => {
        this.form = comboRes.data
        this.careerOptions = careerRes.rows
        this.envOptions = envRes.rows
        this.open = true
        this.title = "修改编码组合"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.patternComboId != null) {
            updateCombo(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addCombo(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const patternComboIds = row.patternComboId || this.ids
      this.$modal.confirm('是否确认删除编码组合编号为"' + patternComboIds + '"的数据项？').then(function() {
        return delCombo(patternComboIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('xycc/combo/export', {
        ...this.queryParams
      }, `combo_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
