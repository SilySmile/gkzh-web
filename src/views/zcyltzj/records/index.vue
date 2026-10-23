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
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="records" border stripe>
      <el-table-column prop="recordId" label="记录 ID" width="90" align="center" />
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
      <el-table-column label="操作" width="90" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button
            type="text"
            size="small"
            class="danger-text"
            @click="remove(scope.row)"
            >删除</el-button
          >
        </template>
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
      description="暂无符合条件的参与记录"
    />
  </div>
</template>

<script>
import { listRecords, deleteRecord, listPoints, zcyltzjErrorMessage } from "@/api/zcyltzj";
import { listSchool } from "@/api/school/school";
import { listDepartment } from "@/api/school/department";
import { listInstances } from "@/api/activity/week";

export default {
  name: "ZcyltzjRecords",
  data() {
    return {
      loading: false,
      records: [],
      total: 0,
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
    load() {
      this.loading = true;
      const params = { ...this.query };
      if (this.dateRange && this.dateRange.length === 2) {
        params.startDate = this.dateRange[0];
        params.endDate = this.dateRange[1];
      }
      listRecords(params)
        .then((res) => {
          this.records = res.rows || res.data || [];
          this.total = Number(res.total != null ? res.total : this.records.length);
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)))
        .finally(() => {
          this.loading = false;
        });
    },
    remove(row) {
      this.$modal
        .confirm(
          "确认删除该条参与记录吗？将同时删除对应的活动游戏参与数据，删除后可重新扫码参与，便于测试。",
        )
        .then(() => deleteRecord(row.recordId))
        .then(() => {
          this.$modal.msgSuccess("记录已删除");
          if (this.records.length === 1 && this.query.pageNum > 1) {
            this.query.pageNum -= 1;
          }
          this.load();
        })
        .catch((error) => {
          if (error) this.$modal.msgError(zcyltzjErrorMessage(error));
        });
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
    statusText(status) {
      return status === "finished" ? "已完成" : "进行中";
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
.danger-text {
  color: #f56c6c;
}
.pressure-tag {
  color: #fff;
  border: none;
}
/deep/ .el-table th {
  background: #f5f7fa;
}
</style>
