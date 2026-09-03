<!-- 后台配置页：四个菜单入口共用本页，通过路由 query.tab 定位当前功能。 -->
<template>
  <div class="app-container">
    <el-tabs v-model="tab" @tab-click="load">
      <el-tab-pane label="维度设置" name="dimension">
        <el-form :inline="true" size="small" class="query-form">
          <el-form-item label="维度名称"
            ><el-input
              v-model="dimensionName"
              clearable
              placeholder="请输入维度名称"
          /></el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="load"
            >搜索</el-button
          >
          <el-button icon="el-icon-refresh" @click="resetQuery('dimension')"
            >重置</el-button
          >
        </el-form>
        <div class="action-bar">
          <el-button
            class="btn-add"
            size="small"
            icon="el-icon-plus"
            @click="add('dimension')"
            >新增</el-button
          >
          <el-button
            class="btn-edit"
            size="small"
            icon="el-icon-edit"
            :disabled="!selectedRows.length"
            @click="editSelected"
            >修改</el-button
          >
          <el-button
            class="btn-delete"
            size="small"
            icon="el-icon-delete"
            :disabled="!selectedRows.length"
            @click="removeSelected"
            >删除</el-button
          >
          <el-button
            class="btn-export"
            size="small"
            icon="el-icon-download"
            :disabled="!rows.length"
            @click="exportRows"
            >导出</el-button
          >
        </div>
        <el-table
          v-loading="loading"
          :data="rows"
          class="mt20"
          @selection-change="handleSelectionChange"
          ><el-table-column type="selection" width="55" /><el-table-column
            prop="dimensionId"
            label="ID"
            width="80"
          /><el-table-column prop="name" label="名称" /><el-table-column
            prop="description"
            label="说明"
            show-overflow-tooltip
          /><el-table-column
            prop="status"
            label="状态"
            width="80"
            align="center"
            ><template slot-scope="s"
              ><el-tag
                v-if="String(s.row.status) === '0'"
                type="primary"
                size="small"
                >正常</el-tag
              ><el-tag v-else type="info" size="small">停用</el-tag></template
            ></el-table-column
          ><el-table-column label="操作" width="80"
            ><template slot-scope="s"
              ><el-button type="text" size="mini" @click="edit(s.row)"
                >编辑</el-button
              ></template
            ></el-table-column
          ></el-table
        >
      </el-tab-pane>
      <el-tab-pane label="职业配置" name="career">
        <el-form :inline="true" size="small" class="query-form">
          <el-form-item label="职业名称"
            ><el-input
              v-model="careerName"
              clearable
              placeholder="请输入职业名称"
          /></el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="load"
            >搜索</el-button
          >
          <el-button icon="el-icon-refresh" @click="resetQuery('career')"
            >重置</el-button
          >
        </el-form>
        <div class="action-bar">
          <el-button
            class="btn-add"
            size="small"
            icon="el-icon-plus"
            @click="add('career')"
            >新增</el-button
          >
          <el-button
            class="btn-edit"
            size="small"
            icon="el-icon-edit"
            :disabled="!selectedRows.length"
            @click="editSelected"
            >修改</el-button
          >
          <el-button
            class="btn-delete"
            size="small"
            icon="el-icon-delete"
            :disabled="!selectedRows.length"
            @click="removeSelected"
            >删除</el-button
          >
          <el-button
            class="btn-export"
            size="small"
            icon="el-icon-download"
            :disabled="!rows.length"
            @click="exportRows"
            >导出</el-button
          >
        </div>
        <el-table
          v-loading="loading"
          :data="rows"
          class="mt20"
          @selection-change="handleSelectionChange"
          ><el-table-column type="selection" width="55" /><el-table-column
            prop="careerId"
            label="ID"
            width="80"
          /><el-table-column prop="name" label="职业" /><el-table-column
            prop="major"
            label="相关专业"
          /><el-table-column
            prop="description"
            label="说明"
            show-overflow-tooltip
          /><el-table-column
            prop="status"
            label="状态"
            width="80"
            align="center"
            ><template slot-scope="s"
              ><el-tag
                v-if="String(s.row.status) === '0'"
                type="primary"
                size="small"
                >正常</el-tag
              ><el-tag v-else type="info" size="small">停用</el-tag></template
            ></el-table-column
          ><el-table-column label="操作" width="80"
            ><template slot-scope="s"
              ><el-button type="text" size="mini" @click="edit(s.row)"
                >编辑</el-button
              ></template
            ></el-table-column
          ></el-table
        >
      </el-tab-pane>
      <el-tab-pane label="维度排序及文案" name="rank">
        <el-form inline size="small" class="query-form"
          ><el-form-item label="维度"
            ><el-select v-model="dimensionId" clearable placeholder="全部"
              ><el-option
                v-for="d in dimensions"
                :key="d.dimensionId"
                :label="d.name"
                :value="d.dimensionId" /></el-select></el-form-item
          ><el-button type="primary" @click="load">查询</el-button
          ><el-button @click="resetQuery('rank')">重置</el-button></el-form
        >
        <div class="action-bar">
          <el-button
            class="btn-add"
            size="small"
            icon="el-icon-plus"
            @click="add('rank')"
            >新增</el-button
          >
          <el-button
            class="btn-edit"
            size="small"
            icon="el-icon-edit"
            :disabled="!selectedRows.length"
            @click="editSelected"
            >修改</el-button
          >
          <el-button
            class="btn-delete"
            size="small"
            icon="el-icon-delete"
            :disabled="!selectedRows.length"
            @click="removeSelected"
            >删除</el-button
          >
          <el-button
            class="btn-export"
            size="small"
            icon="el-icon-download"
            :disabled="!rows.length"
            @click="exportRows"
            >导出</el-button
          >
        </div>
        <el-table
          v-loading="loading"
          :data="rows"
          class="mt20"
          @selection-change="handleSelectionChange"
          ><el-table-column type="selection" width="55" /><el-table-column
            prop="rankId"
            label="ID"
            width="80"
          /><el-table-column
            prop="dimensionName"
            label="维度"
            width="140"
          /><el-table-column
            prop="careerName"
            label="职业"
            width="160"
          /><el-table-column
            prop="rankOrder"
            label="正确名次"
            width="100"
          /><el-table-column
            prop="description"
            label="排序说明"
            show-overflow-tooltip
          /><el-table-column
            prop="status"
            label="状态"
            width="80"
            align="center"
            ><template slot-scope="s"
              ><el-tag
                v-if="String(s.row.status) === '0'"
                type="primary"
                size="small"
                >正常</el-tag
              ><el-tag v-else type="info" size="small">停用</el-tag></template
            ></el-table-column
          ><el-table-column label="操作" width="80"
            ><template slot-scope="s"
              ><el-button type="text" size="mini" @click="edit(s.row)"
                >编辑</el-button
              ></template
            ></el-table-column
          ></el-table
        >
      </el-tab-pane>
      <el-tab-pane label="房间游玩日志" name="log"
        ><el-form inline size="small" class="query-form"
          ><el-form-item label="活动名称"
            ><el-input
              v-model="activityName"
              clearable
              placeholder="请输入活动名称" /></el-form-item
          ><el-form-item label="用户姓名/学号"
            ><el-input
              v-model="keyword"
              clearable
              placeholder="请输入姓名或学号" /></el-form-item
          ><el-form-item label="房间号"
            ><el-input v-model="roomCode" clearable /></el-form-item
          ><el-button type="primary" @click="load">查询</el-button
          ><el-button @click="resetQuery('log')">重置</el-button></el-form
        >
        <div class="action-bar log-actions">
          <el-button
            class="btn-export"
            size="small"
            icon="el-icon-download"
            :disabled="!rows.length"
            @click="exportRows"
            >导出</el-button
          >
        </div>
        <!-- 主列表按“活动ID + 用户”汇总，每位用户在同一活动仅保留最新的一条职场TOP记录。 -->
        <el-table
          v-loading="loading"
          :data="rows"
          class="mt20"
          @selection-change="handleSelectionChange"
        >
          <!-- <el-table-column prop="instanceId" label="活动ID" width="90" /> -->
          <el-table-column prop="logId" label="ID" align="center" />
          <el-table-column prop="roomCode" label="房间号" align="center" />
          <el-table-column
            prop="activityTitle"
            label="活动名称"
            min-width="140"
            show-overflow-tooltip
            align="center"
          />
          <el-table-column prop="roomId" align="center" label="最新房间ID" />
          <el-table-column
            prop="studentName"
            label="用户姓名"
            min-width="120"
            align="center"
          />
          <el-table-column
            prop="studentNo"
            label="学号"
            min-width="120"
            align="center"
          />
          <el-table-column
            prop="logCount"
            label="事件数"
            width="200"
            align="center"
          />
          <el-table-column
            prop="roomStatusName"
            align="center"
            label="状态"
            width="200"
          >
            <template slot-scope="s"
              ><el-tag
                v-if="s.row.roomStatus === 'passed'"
                type="success"
                size="small"
                >成功</el-tag
              ><el-tag
                v-else-if="s.row.roomStatus === 'failed'"
                type="danger"
                size="small"
                >失败</el-tag
              ><el-tag v-else type="info" size="small">{{
                s.row.roomStatusName
              }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column
            prop="createTime"
            label="最近操作时间"
            width="300"
            align="center"
          />
          <el-table-column
            label="操作"
            width="120"
            fixed="right"
            align="center"
          >
            <template slot-scope="s"
              ><el-button
                type="text"
                size="mini"
                @click="viewRoomLogDetails(s.row)"
                >查看详情</el-button
              ></template
            ></el-table-column
          ></el-table
        ></el-tab-pane
      >
    </el-tabs>
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="query.pageNum"
      :limit.sync="query.pageSize"
      @pagination="load"
    />
    <el-dialog
      :title="isNew ? '新增' : '编辑'"
      :visible.sync="open"
      width="560px"
      ><el-form ref="form" :model="form" label-width="100px"
        ><template v-if="tab === 'dimension'"
          ><el-form-item label="维度名称"
            ><el-input v-model="form.name" /></el-form-item></template
        ><template v-if="tab === 'career'"
          ><el-form-item label="职业"
            ><el-input v-model="form.name" /></el-form-item
          ><el-form-item label="相关专业"
            ><el-input v-model="form.major" /></el-form-item></template
        ><template v-if="tab === 'rank'"
          ><el-form-item label="维度"
            ><el-select v-model="form.dimensionId" filterable
              ><el-option
                v-for="d in dimensions"
                :key="d.dimensionId"
                :label="d.name"
                :value="d.dimensionId" /></el-select></el-form-item
          ><el-form-item label="职业"
            ><el-select v-model="form.careerId" filterable
              ><el-option
                v-for="c in careers"
                :key="c.careerId"
                :label="c.name"
                :value="c.careerId" /></el-select></el-form-item
          ><el-form-item label="正确名次"
            ><el-input-number
              v-model="form.rankOrder"
              :min="1" /></el-form-item></template
        ><el-form-item label="说明"
          ><el-input
            type="textarea"
            :rows="4"
            v-model="form.description" /></el-form-item
        ><el-form-item label="状态"
          ><el-radio-group v-model="form.status"
            ><el-radio label="0">正常</el-radio
            ><el-radio label="1">停用</el-radio></el-radio-group
          ></el-form-item
        ></el-form
      ><span slot="footer"
        ><el-button @click="open = false">取消</el-button
        ><el-button type="primary" @click="save">保存</el-button></span
      ></el-dialog
    >
    <!-- 房间事件按时间顺序展示，避免用户记录主列表重复显示同一房间。 -->
    <el-dialog
      :title="logDetailTitle"
      :visible.sync="logDetailOpen"
      width="900px"
      append-to-body
    >
      <el-table
        v-loading="loadingLogDetails"
        :data="logDetailRows"
        max-height="500"
      >
        <el-table-column prop="logId" label="ID" width="80" />
        <el-table-column prop="createTime" label="时间" width="170" />
        <el-table-column prop="eventName" label="事件" width="100" />
        <el-table-column
          prop="content"
          label="内容"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column prop="studentName" label="用户姓名" width="110" />
        <el-table-column prop="studentNo" label="学号" width="130" />
        <el-table-column label="操作" width="130" fixed="right"
          ><template slot-scope="s"
            ><el-button
              type="text"
              size="mini"
              class="delete-record"
              :loading="deletingLogId === s.row.logId"
              :disabled="deletingLogId !== null"
              @click="clearUserRecordByLog(s.row)"
              >{{
                deletingLogId === s.row.logId
                  ? "删除中"
                  : s.row.userId
                  ? "删除该用户记录"
                  : "删除日志"
              }}</el-button
            ></template
          ></el-table-column
        >
      </el-table>
      <span slot="footer"
        ><el-button @click="logDetailOpen = false">关闭</el-button></span
      >
    </el-dialog>
  </div>
</template>
<script>
// 页面只负责展示和提交配置，业务判定仍由后端 sszctop 服务完成。
import {
  listDimensions,
  saveDimension,
  deleteDimension,
  listCareers,
  saveCareer,
  deleteCareer,
  listRanks,
  saveRank,
  deleteRank,
  listRoomLogs,
  getRoomLogDetails,
  clearTestRecord,
} from "@/api/sszctop";
export default {
  name: "SszctopConfig",
  data() {
    return {
      tab: "dimension",
      rows: [],
      selectedRows: [],
      total: 0,
      loading: false,
      deletingLogId: null,
      logDetailOpen: false,
      loadingLogDetails: false,
      logDetailTitle: "房间游玩详情",
      logDetailRoomId: null,
      logDetailRows: [],
      open: false,
      isNew: true,
      form: {},
      query: { pageNum: 1, pageSize: 10 },
      dimensions: [],
      careers: [],
      dimensionName: "",
      careerName: "",
      dimensionId: null,
      roomCode: null,
      activityName: "",
      keyword: "",
      statusOptions: [
        { label: "正常", value: "0" },
        { label: "停用", value: "1" },
      ],
    };
  },
  created() {
    this.tab = this.$route.query.tab || "dimension";
    this.loadDimensions();
    this.loadCareers();
    this.load();
  },
  methods: {
    loadDimensions() {
      listDimensions({ pageNum: 1, pageSize: 100 }).then(
        (r) => (this.dimensions = r.rows || []),
      );
    },
    loadCareers() {
      listCareers({ pageNum: 1, pageSize: 100 }).then(
        (r) => (this.careers = r.rows || []),
      );
    },
    load() {
      this.loading = true;
      let api =
        this.tab === "dimension"
          ? listDimensions
          : this.tab === "career"
          ? listCareers
          : this.tab === "rank"
          ? listRanks
          : listRoomLogs;
      let p = { ...this.query };
      if (this.tab === "dimension") p.name = this.dimensionName;
      if (this.tab === "career") p.name = this.careerName;
      if (this.tab === "rank") p.dimensionId = this.dimensionId;
      if (this.tab === "log") {
        p.activityName = this.activityName;
        p.roomCode = this.roomCode;
        p.keyword = this.keyword;
      }
      api(p)
        .then((r) => {
          this.rows = r.rows || [];
          this.selectedRows = [];
          this.total = r.total || 0;
        })
        .finally(() => (this.loading = false));
    },
    add(type) {
      this.tab = type;
      this.isNew = true;
      this.form = { status: "0", sortOrder: 0 };
      this.open = true;
    },
    resetQuery(type) {
      if (type === "dimension") this.dimensionName = "";
      if (type === "career") this.careerName = "";
      if (type === "rank") this.dimensionId = null;
      if (type === "log") {
        this.activityName = "";
        this.roomCode = null;
        this.keyword = "";
      }
      this.query.pageNum = 1;
      this.load();
    },
    edit(row) {
      this.isNew = false;
      this.form = { ...row };
      this.open = true;
    },
    // 统一处理列表勾选，修改和删除按钮均只针对当前选中的一条记录。
    handleSelectionChange(rows) {
      this.selectedRows = rows;
    },
    editSelected() {
      if (this.selectedRows.length !== 1) {
        this.$modal.msgWarning("请选择一条记录进行修改");
        return;
      }
      this.edit(this.selectedRows[0]);
    },
    removeSelected() {
      if (!this.selectedRows.length) return;
      if (this.tab === "log") return;
      const row = this.selectedRows[0];
      const id =
        this.tab === "dimension"
          ? row.dimensionId
          : this.tab === "career"
          ? row.careerId
          : row.rankId;
      const api =
        this.tab === "dimension"
          ? deleteDimension
          : this.tab === "career"
          ? deleteCareer
          : deleteRank;
      this.$modal
        .confirm("是否确认删除选中的配置？")
        .then(() => api(id))
        .then(() => {
          this.$modal.msgSuccess("删除成功");
          this.load();
          this.loadDimensions();
          this.loadCareers();
        });
    },
    // 点击活动用户汇总行后读取其最新房间事件；主列表不会重复显示该用户在同一活动中的多次入房记录。
    viewRoomLogDetails(row) {
      this.logDetailTitle = `${row.activityTitle || "活动"} · ${
        row.studentName || "用户"
      } 游玩详情`;
      this.logDetailRoomId = row.roomId;
      this.logDetailOpen = true;
      this.loadingLogDetails = true;
      getRoomLogDetails(row.roomId)
        .then((res) => {
          this.logDetailRows = res.data || [];
        })
        .finally(() => {
          this.loadingLogDetails = false;
        });
    },
    // 删除用户日志时，服务端仅清理该用户当前活动的职场TOP数据，不影响同组成员和其他活动。
    clearUserRecordByLog(row) {
      const student = row.studentName || "该用户";
      const message = row.userId
        ? `确认删除${student}的职场TOP记录吗？该操作不会影响同组其他成员。`
        : "确认删除这条系统日志吗？";
      this.$modal
        .confirm(message)
        .then(() => {
          this.deletingLogId = row.logId;
          return clearTestRecord(row.logId);
        })
        .then((res) => {
          this.$modal.msgSuccess(res.msg || "记录已删除");
          this.load();
          if (this.logDetailRoomId)
            this.viewRoomLogDetails({
              roomId: this.logDetailRoomId,
              roomCode: "",
            });
        })
        .finally(() => {
          this.deletingLogId = null;
        });
    },
    // 将当前列表导出为 UTF-8 CSV，便于后台人员留存和二次编辑。
    exportRows() {
      const columns =
        this.tab === "dimension"
          ? [
              ["ID", "dimensionId"],
              ["名称", "name"],
              ["说明", "description"],
              ["状态", "status"],
            ]
          : this.tab === "career"
          ? [
              ["ID", "careerId"],
              ["职业", "name"],
              ["相关专业", "major"],
              ["说明", "description"],
              ["状态", "status"],
            ]
          : this.tab === "rank"
          ? [
              ["ID", "rankId"],
              ["维度", "dimensionName"],
              ["职业", "careerName"],
              ["正确名次", "rankOrder"],
              ["排序说明", "description"],
              ["状态", "status"],
            ]
          : [
              ["活动ID", "instanceId"],
              ["活动名称", "activityTitle"],
              ["最新房间ID", "roomId"],
              ["最近操作时间", "createTime"],
              ["房间号", "roomCode"],
              ["状态", "roomStatusName"],
              ["用户姓名", "studentName"],
              ["学号", "studentNo"],
              ["事件数", "logCount"],
            ];
      const csv = [
        columns.map((c) => c[0]),
        ...this.rows.map((row) =>
          columns.map((c) => {
            const value =
              c[1] === "status"
                ? String(row[c[1]]) === "0"
                  ? "正常"
                  : "停用"
                : row[c[1]] == null
                ? ""
                : row[c[1]];
            return `"${String(value).replace(/"/g, '""')}"`;
          }),
        ),
      ]
        .map((line) => line.join(","))
        .join("\n");
      const blob = new Blob(["\\ufeff" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `sszctop-${this.tab}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    save() {
      let api =
        this.tab === "dimension"
          ? saveDimension
          : this.tab === "career"
          ? saveCareer
          : saveRank;
      api(this.form, this.isNew).then(() => {
        this.$modal.msgSuccess("保存成功");
        this.open = false;
        this.load();
        this.loadDimensions();
        this.loadCareers();
      });
    },
  },
};
</script>
<style scoped>
::v-deep .el-tabs__header {
  display: none;
}
.el-tabs {
  margin-top: -12px;
}
.query-form {
  margin-bottom: 16px;
}
.query-form .el-button {
  margin-left: 8px;
}
.action-bar {
  display: flex;
  gap: 10px;
  margin: 0 0 16px 0;
}
.action-bar .el-button {
  min-width: 72px;
  border-radius: 3px;
}
.action-bar .btn-add {
  color: #409eff;
  background: #ecf5ff;
  border-color: #b3d8ff;
}
.action-bar .btn-edit {
  color: #67c23a;
  background: #f0f9eb;
  border-color: #c2e7b0;
}
.action-bar .btn-delete {
  color: #f56c6c;
  background: #fef0f0;
  border-color: #fbc4c4;
}
.action-bar .btn-export {
  color: #e6a23c;
  background: #fdf6ec;
  border-color: #f5dab1;
}
.action-bar .el-button.is-disabled {
  opacity: 0.55;
}
.log-actions {
  margin-top: -4px;
}
.delete-record {
  color: #f56c6c;
}
.mt20 {
  margin-top: 16px;
}
</style>
