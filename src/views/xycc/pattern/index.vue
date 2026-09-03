<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="图案名称" prop="description">
        <el-input
          v-model="queryParams.description"
          placeholder="请输入图案名称"
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
          v-hasPermi="['xycc:pattern:add']"
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
          v-hasPermi="['xycc:pattern:edit']"
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
          v-hasPermi="['xycc:pattern:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['xycc:pattern:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="patternList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="patternId" />
      <el-table-column label="行编号" align="center" prop="rowCode" />
      <el-table-column label="图案名称" align="center" prop="description" />
      <el-table-column label="图案" align="center" prop="imgUrl">
        <template slot-scope="scope">
          <el-image
            style="width: 50px; height: 50px"
            :src="getImageUrl(scope.row.imgUrl)"
            :preview-src-list="[getImageUrl(scope.row.imgUrl)]"
            fit="cover"
          ></el-image>
        </template>
      </el-table-column>
      <el-table-column label="源素材" align="center" prop="materialUrl">
        <template slot-scope="scope">
          <span v-if="scope.row.materialUrl">{{ scope.row.materialUrl }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="行号" align="center" prop="rowIndex" />
      <el-table-column label="列号" align="center" prop="colIndex" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['xycc:pattern:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['xycc:pattern:remove']"
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

    <!-- 添加或修改心愿橱窗对话框 -->
    <el-dialog v-if="open" :title="title" :visible.sync="open" width="500px" append-to-body @close="handleClose" :destroy-on-close="true">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">

        <el-form-item label="行编号" prop="rowCode" required>
          <el-input v-model="form.rowCode" placeholder="请输入行编号" />
        </el-form-item>
        <el-form-item label="图案名称" prop="description" required>
          <el-input v-model="form.description" placeholder="请输入图案名称" />
        </el-form-item>
        <el-form-item label="上传" prop="imgUrl" required>
          <el-upload ref="img_url"
                     :limit="1"
                     :headers="upload.headers"
                     accept=".jpg,.png"
                     :file-list="upload.fileList"
                     :action="upload.url"
                     :on-success="handleFileSuccess"
                     :on-progress="handleFileUploadProgress"
                     :before-upload="beforeUpload"
                     :on-remove="handleRemove"
                     list-type="picture-card">
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">只能上传不超过 2MB 的文件</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="源素材">
          <el-input v-model="form.materialUrl" placeholder="EPS/SVG 源素材路径" />
        </el-form-item>
        <el-form-item label="行号" prop="rowIndex">
          <el-input v-model="form.rowIndex" placeholder="请输入行号，从0开始" />
        </el-form-item>
        <el-form-item label="列号" prop="colIndex">
          <el-input v-model="form.colIndex" placeholder="请输入列号，从0开始" />
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
import { listPattern, getPattern, delPattern, addPattern, updatePattern } from "@/api/xycc/pattern"
import { getToken } from "@/utils/auth";
export default {
  name: "Pattern",
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
      // 心愿橱窗表格数据
      patternList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        rowIndex: null,
        rowCode: null,
        colIndex: null,
        description: null,
        imgUrl: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        rowCode:[
          { required:true,message:"请输入行编号",trigger:"blur"}
        ],
        description: [
          { required: true, message: "请输入图案名称",trigger: "blur"}
        ],
        imgUrl: [
          { required: true, message: "请上传图片", trigger: "blur" }
        ]
      },
      upload: {
        // 是否禁用上传
        isUploading: false,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: process.env.VUE_APP_BASE_API + "/common/upload",
        // 上传的文件列表
        fileList: []
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询心愿橱窗列表 */
    getList() {
      this.loading = true
      listPattern(this.queryParams).then(response => {
        this.patternList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 处理对话框关闭
    handleClose() {
      this.$nextTick(() => {
        this.reset()
      });
    },
    // 表单重置
    reset() {
      this.upload.fileList = []  // 先清空文件列表
      this.form = {
        patternId: null,
        rowIndex: null,
        rowCode: null,
        colIndex: null,
        description: null,
        imgUrl: null,
        materialUrl: null,
        fileName: null
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
      this.ids = selection.map(item => item.patternId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.$nextTick(() => {
        this.title = "添加心愿橱窗"
        this.open = true
      })
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      // 创建对象的深拷贝
      const tempForm = JSON.parse(JSON.stringify(row));

      // 设置表单数据
      this.form = tempForm;
      if (tempForm.imgUrl) {
        this.upload.fileList = [{ name: tempForm.fileName || 'image', url: this.getImageUrl(tempForm.imgUrl)}];
      }

      // 最后再打开对话框
      this.$nextTick(() => {
        this.title = "修改心愿橱窗";
        this.open = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.patternId != null) {
            updatePattern(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addPattern(this.form).then(response => {
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
      const patternIds = row.patternId || this.ids
      this.$modal.confirm('是否确认删除编号为"' + patternIds + '"的数据项？').then(function() {
        return delPattern(patternIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('xycc/pattern/export', {
        ...this.queryParams
      }, `pattern_${new Date().getTime()}.xlsx`)
    },
    beforeUpload(file) {
      let isRightSize = file.size / 1024 / 1024 < 2
      if (!isRightSize) {
        this.$message.error('文件大小超过 2MB')
      }
      console.log("xxxx");
      return isRightSize
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true;
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.isUploading = false;
      this.form.imgUrl = response.fileName;
      this.$message.success("上传成功");
    },
    // 处理文件移除
    handleRemove() {
      this.form.imgUrl = null;
      this.form.fileName = null;
      this.upload.fileList = [];
    },
    getImageUrl(url) {
      if (!url) return '';
      if (url.startsWith('/static/')) return url;
      // 如果已经是完整URL则直接返回，否则拼接基础路径
      return url.startsWith('http') ? url : process.env.VUE_APP_BASE_API + url;
    }
  }
}
</script>
