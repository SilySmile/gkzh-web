<template>
  <div class="app-container">
    <el-form
      :inline="true"
      size="small"
      class="query-form"
      @submit.native.prevent
    >
      <!-- 下列筛选字段都直接对应打印任务中保存的历史快照。 -->
      <el-form-item label="状态"
        ><el-select
          v-model="query.status"
          clearable
          placeholder="全部状态"
          @change="search"
          ><el-option label="待提交" value="pending" /><el-option
            label="已提交"
            value="submitted" /><el-option
            label="打印中"
            value="printing" /><el-option
            label="成功"
            value="success" /><el-option
            label="失败"
            value="failed" /><el-option
            label="已取消"
            value="cancelled" /></el-select
      ></el-form-item>
      <el-form-item label="打印机"
        ><el-select
          v-model="query.printerId"
          clearable
          filterable
          placeholder="全部打印机"
          @change="search"
          ><el-option
            v-for="item in printers"
            :key="item.printerId"
            :label="item.printerName || item.equipmentSn"
            :value="item.printerId" /></el-select
      ></el-form-item>
      <el-form-item label="学校"
        ><el-input
          v-model.trim="query.schoolName"
          clearable
          placeholder="学校名称"
          @keyup.enter.native="search"
      /></el-form-item>
      <el-form-item label="学号"
        ><el-input
          v-model.trim="query.studentNo"
          clearable
          placeholder="学号"
          @keyup.enter.native="search"
      /></el-form-item>
      <el-form-item label="姓名"
        ><el-input
          v-model.trim="query.studentName"
          clearable
          placeholder="学生姓名"
          @keyup.enter.native="search"
      /></el-form-item>
      <el-form-item label="活动"
        ><el-input
          v-model.trim="query.activityName"
          clearable
          placeholder="活动名称"
          @keyup.enter.native="search"
      /></el-form-item>
      <el-form-item label="游戏"
        ><el-input
          v-model.trim="query.gameName"
          clearable
          placeholder="游戏名称"
          @keyup.enter.native="search"
      /></el-form-item>
      <el-form-item label="报告记录"
        ><el-input
          v-model.trim="query.recordId"
          clearable
          placeholder="请输入记录 ID"
          @keyup.enter.native="search"
      /></el-form-item>
      <el-form-item
        ><el-button type="primary" icon="el-icon-search" @click="search"
          >查询</el-button
        ><el-button icon="el-icon-refresh" @click="reset"
          >重置</el-button
        ></el-form-item
      >
    </el-form>
    <div class="toolbar">
      <el-button icon="el-icon-refresh-right" :loading="loading" @click="load"
        >刷新任务</el-button
      ><span class="toolbar-note"
        >报告内容按 76mm × 130mm 标签发送，打印类型：TSPL</span
      >
    </div>
    <el-table v-loading="loading" :data="tasks" border stripe>
      <el-table-column
        prop="taskId"
        label="任务 ID"
        width="90"
        align="center"
      />
      <el-table-column
        prop="recordId"
        label="报告记录"
        width="100"
        align="center"
      />
      <el-table-column
        prop="schoolName"
        label="学校"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column
        prop="studentNo"
        label="学号"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column
        prop="studentName"
        label="学生姓名"
        min-width="110"
        show-overflow-tooltip
      />
      <el-table-column
        prop="activityName"
        label="活动"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column
        prop="gameName"
        label="游戏"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column label="打印机" min-width="170"
        ><template slot-scope="scope">{{
          printerName(scope.row)
        }}</template></el-table-column
      >
      <el-table-column prop="printId" label="云端任务 ID" min-width="160" />
      <el-table-column label="状态" width="110" align="center"
        ><template slot-scope="scope"
          ><el-tag :type="taskType(scope.row.status)">{{
            taskText(scope.row.status)
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column
        prop="retryCount"
        label="重试次数"
        width="90"
        align="center"
      />
      <el-table-column label="失败原因" min-width="180"
        ><template slot-scope="scope">{{
          scope.row.errorMessage || "-"
        }}</template></el-table-column
      >
      <el-table-column label="创建时间" width="170" align="center"
        ><template slot-scope="scope">{{
          formatDate(scope.row.createTime)
        }}</template></el-table-column
      >
      <!-- 操作权限来自数据库菜单：查询、取消、重打和删除分别控制。 -->
      <el-table-column label="操作" width="370" fixed="right" align="center"
        ><template slot-scope="scope"
          ><el-button
            v-hasPermi="['zycck:print-task:query']"
            type="text"
            size="small"
            :loading="statusLoading === scope.row.taskId"
            @click="refreshStatus(scope.row)"
            >刷新状态</el-button
          ><el-button
            v-if="canCancel(scope.row)"
            v-hasPermi="['zycck:print-task:cancel']"
            type="text"
            size="small"
            class="danger-text"
            :loading="cancelLoading === scope.row.taskId"
            @click="cancelTask(scope.row)"
            >取消打印</el-button
          ><el-button
            v-hasPermi="['zycck:print-task:reprint']"
            type="text"
            size="small"
            :disabled="!canReprint(scope.row)"
            @click="reprint(scope.row)"
            >重新打印</el-button
          ><el-button
            v-if="canDelete(scope.row)"
            v-hasPermi="['zycck:print-task:remove']"
            type="text"
            size="small"
            class="danger-text"
            :loading="deleteLoading === scope.row.taskId"
            @click="deleteTask(scope.row)"
            >删除记录</el-button
          ></template
        ></el-table-column
      >
    </el-table>
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="query.pageNum"
      :limit.sync="query.pageSize"
      @pagination="load"
    />
    <el-empty v-if="!loading && !tasks.length" description="暂无打印任务" />
  </div>
</template>

<script>
import {
  cancelPrintTask,
  deletePrintTask,
  listPrinters,
  listPrintTasks,
  refreshPrintTaskStatus,
  reprintTask,
} from "@/api/zycck";
import { zycckErrorMessage } from "@/api/zycck";

export default {
  name: "ZycckPrintTasks",
  data() {
    return {
      tasks: [],
      printers: [],
      total: 0,
      loading: false,
      statusLoading: null,
      cancelLoading: null,
      deleteLoading: null,
      query: {
        pageNum: 1,
        pageSize: 10,
        status: "",
        printerId: "",
        recordId: "",
        schoolName: "",
        studentNo: "",
        studentName: "",
        activityName: "",
        gameName: "",
      },
    };
  },
  created() {
    this.loadPrinters();
    this.load();
  },
  methods: {
    // 后端普通 AjaxResult 的数据位于 data；此方法兼容直接返回数组的旧接口。
    unwrap(res) {
      return (res && res.data) || res || [];
    },
    loadPrinters() {
      listPrinters()
        .then((res) => {
          this.printers = this.unwrap(res);
        })
        .catch((e) => this.$modal.msgError(zycckErrorMessage(e)));
    },
    load() {
      this.loading = true;
      listPrintTasks({
        ...this.query,
        status: this.query.status || undefined,
        printerId: this.query.printerId || undefined,
        recordId: this.query.recordId || undefined,
      })
        .then((res) => {
          this.tasks = res.rows || [];
          this.total = Number(res.total) || 0;
        })
        .catch((e) => this.$modal.msgError(zycckErrorMessage(e)))
        .finally(() => {
          this.loading = false;
        });
    },
    // 所有查询条件变化后回到第一页，避免当前页码超过过滤后的总页数。
    search() {
      this.query.pageNum = 1;
      this.load();
    },
    emptyQuery() {
      return {
        pageNum: 1,
        pageSize: 10,
        status: "",
        printerId: "",
        recordId: "",
        schoolName: "",
        studentNo: "",
        studentName: "",
        activityName: "",
        gameName: "",
      };
    },
    reset() {
      this.query = this.emptyQuery();
      this.load();
    },
    refreshStatus(row) {
      this.statusLoading = row.taskId;
      refreshPrintTaskStatus(row.taskId)
        .then((res) => {
          const item = this.unwrap(res);
          const index = this.tasks.findIndex(
            (task) => task.taskId === item.taskId,
          );
          if (index >= 0) this.$set(this.tasks, index, item);
          else this.load();
        })
        .catch((e) => this.$modal.msgError(zycckErrorMessage(e)))
        .finally(() => {
          this.statusLoading = null;
        });
    },
    reprint(row) {
      this.$modal
        .confirm("确认重新打印该报告？")
        .then(() => reprintTask(row.taskId))
        .then(() => {
          this.$modal.msgSuccess("重打印任务已提交");
          this.query.pageNum = 1;
          this.load();
        })
        .catch((e) => {
          if (e) this.$modal.msgError(zycckErrorMessage(e));
        });
    },
    // “取消打印”会先核对汉印云状态，不是只修改本地状态。
    cancelTask(row) {
      this.$modal
        .confirm("取消前会先核对云端打印状态，确认继续？")
        .then(() => {
          this.cancelLoading = row.taskId;
          return cancelPrintTask(row.taskId);
        })
        .then(() => {
          this.$modal.msgSuccess("打印任务已取消");
          this.load();
        })
        .catch((e) => {
          if (e) this.$modal.msgError(zycckErrorMessage(e));
        })
        .finally(() => {
          this.cancelLoading = null;
        });
    },
    // 删除仅清理本地测试记录；成功记录删除后，该用户可以重新测试打印。
    deleteTask(row) {
      this.$modal
        .confirm(
          "确认删除该打印记录？删除后不可恢复；如果这是成功记录，该用户将可以再次打印。",
        )
        .then(() => {
          this.deleteLoading = row.taskId;
          return deletePrintTask(row.taskId);
        })
        .then(() => {
          this.$modal.msgSuccess("打印记录已删除");
          if (this.tasks.length === 1 && this.query.pageNum > 1)
            this.query.pageNum -= 1;
          this.load();
        })
        .catch((e) => {
          if (e) this.$modal.msgError(zycckErrorMessage(e));
        })
        .finally(() => {
          this.deleteLoading = null;
        });
    },
    // 待提交、已提交、打印中和失败任务均可尝试取消；服务端仍会做最终判断。
    canCancel(row) {
      return ["pending", "submitted", "printing", "failed"].includes(
        row.status,
      );
    },
    // 成功任务严格禁止重打，只有失败或已取消任务开放重打按钮。
    canReprint(row) {
      return ["failed", "cancelled"].includes(row.status);
    },
    // 进行中的任务需先取消，只有终态任务可以删除本地记录。
    canDelete(row) {
      return ["success", "failed", "cancelled"].includes(row.status);
    },
    printerName(row) {
      const item = this.printers.find(
        (printer) => printer.printerId === row.printerId,
      );
      return item
        ? item.printerName || item.equipmentSn
        : row.equipmentSn || "-";
    },
    taskText(status) {
      return (
        {
          pending: "待提交",
          submitted: "已提交",
          printing: "打印中",
          success: "成功",
          failed: "失败",
          cancelled: "已取消",
        }[status] ||
        status ||
        "未知"
      );
    },
    taskType(status) {
      return status === "success"
        ? "success"
        : status === "failed"
        ? "danger"
        : status === "printing"
        ? "warning"
        : "info";
    },
    formatDate(value) {
      return value ? this.parseTime(value, "{y}-{m}-{d} {h}:{i}:{s}") : "-";
    },
  },
};
</script>

<style scoped>
.query-form {
  margin-bottom: 4px;
}
.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.toolbar-note {
  margin-left: auto;
  color: #909399;
  font-size: 13px;
}
.danger-text {
  color: #f56c6c;
}
</style>
