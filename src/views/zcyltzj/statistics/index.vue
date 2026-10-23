<template>
  <div class="app-container">
    <el-form
      ref="queryForm"
      :model="query"
      :inline="true"
      size="small"
      label-width="68px"
    >
      <el-form-item label="学校" prop="schoolId">
        <el-select
          v-model="query.schoolId"
          clearable
          filterable
          placeholder="全部学校"
          @change="schoolChanged"
        >
          <el-option
            v-for="item in schools"
            :key="item.schoolId"
            :label="item.title || item.name"
            :value="item.schoolId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="活动" prop="instanceId">
        <el-select
          v-model="query.instanceId"
          clearable
          filterable
          placeholder="全部活动"
        >
          <el-option
            v-for="item in activities"
            :key="item.instanceId"
            :label="item.title || item.name"
            :value="item.instanceId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="院系" prop="departmentId">
        <el-select
          v-model="query.departmentId"
          clearable
          filterable
          placeholder="全部院系"
        >
          <el-option
            v-for="item in departments"
            :key="item.departmentId"
            :label="item.name || item.title"
            :value="item.departmentId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="专业" prop="major">
        <el-input
          v-model.trim="query.major"
          clearable
          placeholder="请输入专业"
          @keyup.enter.native="search"
        />
      </el-form-item>
      <el-form-item label="学号" prop="studentNo">
        <el-input
          v-model.trim="query.studentNo"
          clearable
          placeholder="请输入学号"
          @keyup.enter.native="search"
        />
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select v-model="query.gender" clearable placeholder="全部">
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
          <el-option label="其他/未填" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="点数" prop="pointNo">
        <el-select v-model="query.pointNo" clearable placeholder="全部点数">
          <el-option
            v-for="point in points"
            :key="point.pointNo"
            :label="point.pointNo + ' · ' + point.pointName"
            :value="point.pointNo"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="statusFilter">
        <el-select v-model="query.statusFilter" clearable placeholder="全部状态">
          <el-option label="进行中" value="inProgress" />
          <el-option label="已完成" value="finished" />
        </el-select>
      </el-form-item>
      <el-form-item label="参与日期">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="search"
          >查询</el-button
        >
        <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
        <el-button
          v-hasPermi="['zcyltzj:statistics:export']"
          type="success"
          icon="el-icon-download"
          :loading="exporting"
          @click="exportExcel"
          >下载 Excel</el-button
        >
      </el-form-item>
    </el-form>

    <el-alert
      title="统计数据与列表使用同一组筛选条件；下载 Excel 需要先选择学校和活动，导出全部匹配记录，不受分页影响。"
      type="info"
      :closable="false"
      class="tip"
    />

    <el-row :gutter="16" class="summary-row">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">参与人数</div>
          <div class="metric-value">{{ summary.total || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">完成人数</div>
          <div class="metric-value">{{ summary.finished || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">完成率</div>
          <div class="metric-value">{{ completionRate }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">平均压力值</div>
          <div class="metric-value">{{ averagePressure }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16" class="summary-row">
      <el-col :span="6">
        <el-card shadow="never" class="color-card red">
          <div class="metric-label">红色结果人数</div>
          <div class="metric-value">{{ summary.redCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="color-card green">
          <div class="metric-label">绿色结果人数</div>
          <div class="metric-value">{{ summary.greenCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="color-card yellow">
          <div class="metric-label">黄色结果人数</div>
          <div class="metric-value">{{ summary.yellowCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">参与记录总数</div>
          <div class="metric-value">{{ total }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="records" border stripe>
      <el-table-column prop="studentName" label="学生姓名" width="110" align="center" />
      <el-table-column prop="studentNo" label="学号" width="130" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="150" align="center" />
      <el-table-column prop="departmentName" label="院系" min-width="140" align="center" />
      <el-table-column prop="major" label="专业" min-width="120" align="center" />
      <el-table-column prop="gender" label="性别" width="70" align="center" />
      <el-table-column prop="instanceName" label="活动" min-width="170" align="center" />
      <el-table-column label="点数" width="130" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.pointNo">
            {{ scope.row.pointNo }} · {{ scope.row.pointName }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="压力值" width="100" align="center">
        <template slot-scope="scope">
          <el-tag
            v-if="scope.row.pressureValue != null"
            :color="colorValue(scope.row.color)"
            class="pressure-tag"
            >{{ scope.row.pressureValue }}%</el-tag
          >
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'finished' ? 'success' : 'info'">{{
            scope.row.status === "finished" ? "已完成" : "进行中"
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="参与时间" width="160" align="center">
        <template slot-scope="scope">{{
          formatDateTime(scope.row.scanTime)
        }}</template>
      </el-table-column>
      <el-table-column label="完成时间" width="160" align="center">
        <template slot-scope="scope">{{
          formatDateTime(scope.row.finishTime)
        }}</template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="query.pageNum"
      :limit.sync="query.pageSize"
      @pagination="load"
    />
    <el-empty
      v-if="!loading && !records.length"
      description="暂无符合条件的统计数据"
    />
  </div>
</template>

<script>
import { getStatistics, exportStatisticsExcel, listPoints, zcyltzjErrorMessage } from "@/api/zcyltzj";
import { saveAs } from "file-saver";
import { listSchool } from "@/api/school/school";
import { listDepartment } from "@/api/school/department";
import { listInstances } from "@/api/activity/week";

export default {
  name: "ZcyltzjStatistics",
  data() {
    return {
      loading: false,
      exporting: false,
      records: [],
      total: 0,
      summary: {},
      schools: [],
      departments: [],
      activities: [],
      points: [],
      dateRange: null,
      query: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        pointNo: null,
        statusFilter: null,
      },
    };
  },
  computed: {
    completionRate() {
      const total = Number(this.summary.total) || 0;
      if (!total) return "0%";
      const rate = Number(this.summary.completionRate);
      return (Number.isFinite(rate) ? rate : 0) + "%";
    },
    averagePressure() {
      if (this.summary.avgPressure == null) return "-";
      return Math.round(Number(this.summary.avgPressure)) + "%";
    },
  },
  created() {
    this.loadOptions();
    this.load();
  },
  methods: {
    loadOptions() {
      listSchool({ pageNum: 1, pageSize: 1000 })
        .then((res) => {
          this.schools = res.rows || res.data || [];
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)));
      listInstances({})
        .then((res) => {
          this.activities = res.data || res.rows || [];
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)));
      listPoints()
        .then((res) => {
          this.points = res.data || res.rows || [];
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)));
    },
    schoolChanged(schoolId) {
      this.query.departmentId = null;
      this.departments = [];
      if (!schoolId) return;
      listDepartment({ schoolId, pageNum: 1, pageSize: 1000 })
        .then((res) => {
          if (this.query.schoolId === schoolId) {
            this.departments = res.rows || res.data || [];
          }
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)));
    },
    params() {
      const params = { ...this.query };
      if (this.dateRange && this.dateRange.length === 2) {
        params.startDate = this.dateRange[0];
        params.endDate = this.dateRange[1];
      }
      return params;
    },
    load() {
      this.loading = true;
      getStatistics(this.params())
        .then((res) => {
          const data = res.data || {};
          this.summary = data.summary || {};
          this.records = data.records || [];
          this.total = Number(data.total != null ? data.total : this.records.length);
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)))
        .finally(() => {
          this.loading = false;
        });
    },
    async exportExcel() {
      if (!this.query.schoolId || !this.query.instanceId) {
        this.$modal.msgWarning("请先选择学校和活动");
        return;
      }
      this.exporting = true;
      try {
        const params = this.params();
        delete params.pageNum;
        delete params.pageSize;
        const blob = await exportStatisticsExcel(params);
        saveAs(
          blob,
          `职场压力骰子局学生数据_${this.query.schoolId}_${this.query.instanceId}.xlsx`,
        );
      } catch (error) {
        this.$modal.msgError(zcyltzjErrorMessage(error));
      } finally {
        this.exporting = false;
      }
    },
    search() {
      this.query.pageNum = 1;
      this.load();
    },
    reset() {
      this.$refs.queryForm.resetFields();
      this.dateRange = null;
      this.departments = [];
      this.search();
    },
    colorValue(color) {
      if (color === "red") return "#f56c6c";
      if (color === "green") return "#67c23a";
      if (color === "yellow") return "#e6a23c";
      return "#909399";
    },
    formatDateTime(value) {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate(),
      )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds(),
      )}`;
    },
  },
};
</script>

<style scoped>
.tip {
  margin-bottom: 16px;
}
.summary-row {
  margin-bottom: 16px;
}
.metric-label {
  color: #909399;
  font-size: 13px;
}
.metric-value {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 600;
  color: #303133;
}
.color-card.red {
  border-left: 4px solid #f56c6c;
}
.color-card.green {
  border-left: 4px solid #67c23a;
}
.color-card.yellow {
  border-left: 4px solid #e6a23c;
}
.pressure-tag {
  color: #fff;
  border: none;
}
/deep/ .el-table th {
  background: #f5f7fa;
}
</style>
