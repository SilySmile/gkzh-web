<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="活动名称" prop="activityTitle">
        <el-input
          v-model="queryParams.activityTitle"
          placeholder="请输入活动名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="步骤标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入步骤标题"
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
          v-hasPermi="['lottery:task:add']"
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
          v-hasPermi="['lottery:task:edit']"
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
          v-hasPermi="['lottery:task:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['lottery:task:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="taskList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="taskId" />
      <el-table-column label="所属活动" align="center" prop="activityTitle" min-width="120" :show-overflow-tooltip="true"/>
      <el-table-column label="步骤顺序" align="center" prop="stepOrder" />
      <el-table-column label="任务标识" align="center" prop="taskKey" />
      <el-table-column label="步骤标题" align="center" prop="title" />
      <el-table-column label="步骤说明" align="center" prop="description" />
      <el-table-column label="是否必须完成" align="center" prop="isRequired">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.isRequired"
            :active-value="1"
            :inactive-value="0"
            @change="handleIsRequiredChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['lottery:task:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['lottery:task:remove']"
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

    <!-- 添加或修改 前置任务对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="所属活动" prop="activityId">
          <el-select v-model="form.activityId" placeholder="请选择活动" filterable>
            <el-option
              v-for="item in activityOptions"
              :key="item.activityId"
              :label="item.title"
              :value="item.activityId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="步骤顺序" prop="stepOrder">
          <el-input v-model="form.stepOrder" placeholder="请输入步骤顺序" />
        </el-form-item>
        <el-form-item label="任务标识" prop="taskKey">
          <el-input v-model="form.taskKey" placeholder="请输入任务标识" />
        </el-form-item>
        <el-form-item label="步骤标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入步骤标题" />
        </el-form-item>
        <el-form-item label="步骤说明" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="是否必须" prop="isRequired">
          <el-switch
            v-model="form.isRequired"
            :active-value="1"
            :inactive-value="0"
          />
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
import { listTask, getTask, delTask, addTask, updateTask } from "@/api/lottery/task"
import { listActivity } from "@/api/activity/activity"

export default {
  name: "Task",
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
      //  前置任务表格数据
      taskList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 活动选项
      activityOptions: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        activityTitle: null,
        title: null,
      },
      // 表单参数
      form: {
        taskId: null,
        activityId: null,
        stepOrder: null,
        taskKey: null,
        params: null,
        title: null,
        description: null,
        isRequired: 0
      },
      // 表单校验
      rules: {
        activityId: [
          { required: true, message: "所属活动不能为空", trigger: "change" }
        ],
      }
    }
  },
  created() {
    this.getList()
    this.getActivityOptions()
  },
  methods: {
    /** 获取活动选项 */
    getActivityOptions() {
      listActivity().then(response => {
        this.activityOptions = response.rows
      })
    },
    /** 查询 前置任务列表 */
    getList() {
      this.loading = true
      listTask(this.queryParams).then(response => {
        this.taskList = response.rows
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
        taskId: null,
        activityId: null,
        stepOrder: null,
        taskKey: null,
        params: null,
        title: null,
        description: null,
        isRequired: 0
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
      this.ids = selection.map(item => item.taskId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加 前置任务"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const taskId = row.taskId || this.ids
      getTask(taskId).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改 前置任务"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.taskId != null) {
            updateTask(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addTask(this.form).then(response => {
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
      const taskIds = row.taskId || this.ids
      this.$modal.confirm('是否确认删除 前置任务编号为"' + taskIds + '"的数据项？').then(function() {
        return delTask(taskIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('lottery/task/export', {
        ...this.queryParams
      }, `task_${new Date().getTime()}.xlsx`)
    },
    /** 修改是否必须完成状态 */
    handleIsRequiredChange(row) {
      let text = row.isRequired === 1 ? "必须完成" : "非必须完成";
      this.$modal.confirm('确认要将该任务更改为"' + text + '"状态吗？').then(function() {
        return updateTask(row);
      }).then(() => {
        this.$modal.msgSuccess(text + "状态修改成功");
      }).catch(() => {
        row.isRequired = row.isRequired === 1 ? 0 : 1;
      });
    },
  }
}
</script>
