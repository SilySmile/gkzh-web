<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="活动名称" prop="activityTitle" label-width="100px">
        <el-input
          v-model="queryParams.activityTitle"
          placeholder="请输入活动名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="奖品名称" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入奖品名称"
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
          v-hasPermi="['lottery:prize:add']"
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
          v-hasPermi="['lottery:prize:edit']"
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
          v-hasPermi="['lottery:prize:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['lottery:prize:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="prizeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="prizeId" />
      <el-table-column label="所属抽奖活动" align="center" prop="activityTitle" />
      <el-table-column label="奖品名称" align="center" prop="title" />
      <el-table-column label="奖品图片" align="center" prop="imageUrl">
        <template slot-scope="scope">
          <el-image
            style="width: 50px; height: 50px"
            :src="getImageUrl(scope.row.imageUrl)"
            :preview-src-list="[getImageUrl(scope.row.imageUrl)]"
            fit="cover"
          ></el-image>
        </template>
      </el-table-column>
      <el-table-column label="库存数量" align="center" prop="stock" />
      <el-table-column label="权重" align="center" prop="weight" />
      <el-table-column label="奖品类型" align="center" prop="prizeType">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.lottery_prize_type" :value="scope.row.prizeType"/>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" align="center" prop="isEnabled">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.isEnabled"/>
        </template>
      </el-table-column>
      <el-table-column label="显示顺序" align="center" prop="sortOrder" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['lottery:prize:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['lottery:prize:remove']"
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

    <!-- 添加或修改抽奖奖品对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body  @close="handleClose" :destroy-on-close="true">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属抽奖活动" prop="lotteryId">
          <el-select v-model="form.lotteryId" placeholder="请选择所属抽奖活动">
            <el-option v-for="activity in activityOptions" :key="activity.lotteryId" :label="activity.title" :value="activity.lotteryId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="奖品名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入奖品名称" />
        </el-form-item>
        <el-form-item label="奖品图片" prop="imageUrl">
          <el-upload ref="image_url"
                     :limit="1"
                     :headers="upload.headers"
                     accept=".jpg,.png"
                     :file-list="upload.fileList"
                     :action="upload.url"
                     :on-success="handleFileSuccess"
                     :on-progress="handleFileUploadProgress"
                     :before-upload="beforeUpload"
                     :on-remove="handleRemove"
                     :on-preview="handlePreview"
                     list-type="picture-card">
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">只能上传不超过 2MB 的文件</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input v-model="form.stock" placeholder="请输入库存数量" type="number" />
        </el-form-item>
        <el-form-item label="权重" prop="weight">
          <el-input v-model="form.weight" placeholder="请输入权重数值，数值越大中奖概率越高" type="number" />
        </el-form-item>
        <el-form-item label="奖品类型" prop="prizeType">
          <el-select v-model="form.prizeType" placeholder="请选择奖品类型">
            <el-option
              v-for="dict in dict.type.lottery_prize_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-radio-group v-model="form.isEnabled">
            <el-radio
              v-for="dict in dict.type.sys_normal_disable"
              :key="dict.value"
              :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示顺序" prop="sortOrder">
          <el-input v-model="form.sortOrder" placeholder="请输入显示顺序" />
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
import { listPrize, getPrize, delPrize, addPrize, updatePrize } from "@/api/lottery/prize"
import { listActivity } from "@/api/lottery/activity"
import {getToken} from "@/utils/auth";

export default {
  name: "Prize",
  dicts: ['lottery_prize_type', 'sys_normal_disable'],
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
      // 抽奖奖品表格数据
      prizeList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        lotteryId: null,
        activityTitle: null,
        title: null,
        imageUrl: null,
        stock: null,
        weight: null,
        prizeType: null,
        isEnabled: null,
        sortOrder: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        stock: [
          { required: true, message: "库存数量不能为空", trigger: "blur" },
          { pattern: /^(0|[1-9]\d*)$/, message: "库存数量必须为非负整数", trigger: "blur" }
        ],
        title: [
          { required: true, message: "奖品名称不能为空", trigger: "blur" }
        ],
        weight: [
          { required: true, message: "权重不能为空", trigger: "blur" },
          { pattern: /^[1-9]\d*$/, message: "权重必须是正整数", trigger: "blur" }
        ],
        prizeType: [
          { required: true, message: "奖品类型不能为空", trigger: "change" }
        ],
        isEnabled: [
          { required: true, message: "启用状态不能为空", trigger: "change" }
        ]
      },
      activityOptions: [],
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
    /** 查询抽奖奖品列表 */
    getList() {
      this.loading = true
      listPrize(this.queryParams).then(response => {
        this.prizeList = response.rows
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
        this.reset();
      });
    },
    // 表单重置
    reset() {
      this.form = {
        prizeId: null,
        lotteryId: null,
        activityTitle: null,
        title: null,
        imageUrl: null,
        stock: null,
        weight: null,
        prizeType: null,
        isEnabled: "0",
        sortOrder: null
      }
      this.resetForm("form")
      // 清空文件列表
      this.upload.fileList = []
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
      this.ids = selection.map(item => item.prizeId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加抽奖奖品"
      listActivity({orderByColumn:"lotteryId",isAsc:"desc"}).then(response => {
        this.activityOptions = response.rows
      })

    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const prizeId = row.prizeId || this.ids
      // 先获取活动列表
      listActivity({orderByColumn:"lotteryId",isAsc:"desc"}).then(response => {
        this.activityOptions = response.rows
        // 再获取奖品详情
        getPrize(prizeId).then(response => {
          this.form = response.data
          // 处理图片显示
          if (this.form.imageUrl) {
            this.upload.fileList = [{
              name: this.form.imageUrl.substring(this.form.imageUrl.lastIndexOf("/") + 1),
              url: this.getImageUrl(this.form.imageUrl)
            }]
          }
          this.open = true
          this.title = "修改抽奖奖品"
          console.log(this.form)
        })
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.prizeId != null) {
            updatePrize(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addPrize(this.form).then(response => {
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
      const prizeIds = row.prizeId || this.ids
      this.$modal.confirm('是否确认删除抽奖奖品编号为"' + prizeIds + '"的数据项？').then(function() {
        return delPrize(prizeIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('lottery/prize/export', {
        ...this.queryParams
      }, `prize_${new Date().getTime()}.xlsx`)
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
      this.form.imageUrl = response.fileName;
      this.$message.success("上传成功");
    },
    // 处理文件移除
    handleRemove() {
      this.form.imageUrl = null;
      this.upload.fileList = [];
    },
    // 获取图片完整URL
    getImageUrl(url) {
      if (!url) return '';
      // 如果已经是完整URL则直接返回，否则拼接基础路径
      return url.startsWith('http') ? url : process.env.VUE_APP_BASE_API + url;
    },
    // 图片预览
    handlePreview(file) {
      window.open(file.url)
    },
  }
}
</script>
