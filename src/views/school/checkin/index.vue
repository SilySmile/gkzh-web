<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="学校" prop="schoolId">
        <el-select v-model="queryParams.schoolId" placeholder="请选择学校" clearable>
          <el-option
            v-for="school in schoolOptions"
            :key="school.schoolId"
            :label="school.title"
            :value="school.schoolId"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="专业" prop="departmentId">
        <el-select v-model="queryParams.departmentId" placeholder="请选择专业" clearable>
          <el-option
            v-for="dept in departmentOptions"
            :key="dept.departmentId"
            :label="dept.title"
            :value="dept.departmentId"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="学号" prop="studentNo">
        <el-input
          v-model="queryParams.studentNo"
          placeholder="请输入学号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="姓名" prop="studentName">
        <el-input
          v-model="queryParams.studentName"
          placeholder="请输入学生姓名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="签到时间" prop="checkinTime">
        <el-date-picker
          v-model="queryParams.checkinTime"
          type="date"
          placeholder="选择签到日期"
          value-format="yyyy-MM-dd"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="成功" value="0"></el-option>
          <el-option label="失败" value="1"></el-option>
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
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['school:checkin:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['school:checkin:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="checkinList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="签到ID" align="center" prop="checkinId" />
      <el-table-column label="学校" align="center" prop="schoolName" />
      <el-table-column label="专业" align="center" prop="departmentName" />
      <el-table-column label="学号" align="center" prop="studentNo" />
      <el-table-column label="学生姓名" align="center" prop="studentName" />
      <el-table-column label="签到时间" align="center" prop="checkinTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.checkinTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="签到IP" align="center" prop="checkinIp" />
      <el-table-column label="签到地点" align="center" prop="checkinLocation" />
      <el-table-column label="签到设备" align="center" prop="checkinDevice" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="status">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === '0'" type="success">成功</el-tag>
          <el-tag v-else type="danger">失败</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
            v-hasPermi="['school:checkin:query']"
          >查看</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['school:checkin:remove']"
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

    <!-- 查看签到记录详情对话框 -->
    <el-dialog title="签到记录详情" :visible.sync="viewOpen" width="600px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="签到ID">{{ form.checkinId }}</el-descriptions-item>
        <el-descriptions-item label="学生ID">{{ form.studentId }}</el-descriptions-item>
        <el-descriptions-item label="学校">{{ form.schoolName }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ form.departmentName }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ form.studentNo }}</el-descriptions-item>
        <el-descriptions-item label="学生姓名">{{ form.studentName }}</el-descriptions-item>
        <el-descriptions-item label="签到时间">{{ parseTime(form.checkinTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</el-descriptions-item>
        <el-descriptions-item label="签到IP">{{ form.checkinIp }}</el-descriptions-item>
        <el-descriptions-item label="签到地点">{{ form.checkinLocation || '未记录' }}</el-descriptions-item>
        <el-descriptions-item label="签到设备" :span="2">{{ form.checkinDevice || '未记录' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="form.status === '0'" type="success">成功</el-tag>
          <el-tag v-else type="danger">失败</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(form.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ form.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listCheckin, getCheckin, delCheckin } from "@/api/school/checkin";
import { listSchool } from "@/api/school/school";
import { listDepartment } from "@/api/school/department";

export default {
  name: "StudentCheckin",
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
      // 签到记录表格数据
      checkinList: [],
      // 查看弹出层标题
      title: "",
      // 是否显示查看弹出层
      viewOpen: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        departmentId: null,
        studentNo: null,
        studentName: null,
        checkinTime: null,
        status: null
      },
      // 表单参数
      form: {},
      // 学校选项
      schoolOptions: [],
      // 专业选项
      departmentOptions: []
    };
  },
  created() {
    this.getList();
    this.getSchoolOptions();
  },
  methods: {
    /** 查询签到记录列表 */
    getList() {
      this.loading = true;
      listCheckin(this.queryParams).then(response => {
        this.checkinList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 获取学校选项 */
    getSchoolOptions() {
      listSchool().then(response => {
        this.schoolOptions = response.rows;
      });
    },
    /** 获取专业选项 */
    getDepartmentOptions(schoolId) {
      if (schoolId) {
        listDepartment({ schoolId: schoolId }).then(response => {
          this.departmentOptions = response.rows.filter(item => item.parentId > 100); // 只显示专业级别
        });
      } else {
        this.departmentOptions = [];
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.checkinId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 查看按钮操作 */
    handleView(row) {
      const checkinId = row.checkinId || this.ids
      getCheckin(checkinId).then(response => {
        this.form = response.data;
        this.viewOpen = true;
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const checkinIds = row.checkinId || this.ids;
      this.$modal.confirm('是否确认删除签到记录编号为"' + checkinIds + '"的数据项？').then(function() {
        return delCheckin(checkinIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('school/checkin/export', {
        ...this.queryParams
      }, `checkin_${new Date().getTime()}.xlsx`)
    }
  }
};
</script> 