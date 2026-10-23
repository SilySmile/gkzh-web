<template>
  <div class="app-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="点数设置" name="points">
        <el-alert
          title="六个骰子点数分别对应一个职场压力场景，点数名称、主题和职场投射会展示在小程序结果页。"
          type="info"
          :closable="false"
          class="tip"
        />
        <el-table
          v-loading="pointLoading"
          :data="points"
          border
          stripe
          class="point-table"
        >
          <el-table-column label="点数" width="90" align="center">
            <template slot-scope="scope">
              <span class="dice-badge">{{ scope.row.pointNo }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="pointName"
            label="点数名称"
            width="160"
            align="center"
          />
          <el-table-column
            prop="theme"
            label="压力主题"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column
            prop="projection"
            label="职场投射"
            min-width="260"
            show-overflow-tooltip
          />
          <el-table-column label="题目数" width="90" align="center">
            <template slot-scope="scope">
              <el-tag
                :type="Number(scope.row.questionCount) > 0 ? 'success' : 'danger'"
                >{{ scope.row.questionCount || 0 }}</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{
                scope.row.status === "0" ? "启用" : "停用"
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openPoint(scope.row)"
                >编辑</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="试题设置" name="questions">
        <el-alert
          title="每个点数拥有一套试题；学生掷出该点数后作答本套题目，答案按 A、B 计红色，C、D 计绿色统计压力值。"
          type="info"
          :closable="false"
          class="tip"
        />
        <div class="question-toolbar">
          <el-radio-group
            v-model="questionPointNo"
            class="point-radio"
            @change="loadQuestions"
          >
            <el-radio-button
              v-for="point in points"
              :key="point.pointNo"
              :label="point.pointNo"
              >{{ point.pointNo }} · {{ point.pointName }}</el-radio-button
            >
          </el-radio-group>
          <el-button
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="openQuestion()"
            >新增题目</el-button
          >
        </div>
        <el-table v-loading="questionLoading" :data="questions" border stripe>
          <el-table-column prop="questionNo" label="题号" width="70" align="center" />
          <el-table-column
            prop="content"
            label="题干"
            min-width="260"
            show-overflow-tooltip
          />
          <el-table-column
            prop="optionA"
            label="A"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column
            prop="optionB"
            label="B"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column
            prop="optionC"
            label="C"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column
            prop="optionD"
            label="D"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column label="状态" width="80" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{
                scope.row.status === "0" ? "启用" : "停用"
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openQuestion(scope.row)"
                >编辑</el-button
              >
              <el-button
                type="text"
                size="small"
                class="danger-text"
                @click="removeQuestion(scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-if="!questionLoading && !questions.length"
          description="该点数暂无试题，请点击“新增题目”添加"
        />
      </el-tab-pane>

      <el-tab-pane label="规则格设置" name="rules">
        <el-alert
          title="九宫格中间为空，下中和下右两格用于展示规则；学生点击这两格可查看规则内容，骰子点数不会落在规则格上。"
          type="info"
          :closable="false"
          class="tip"
        />
        <el-table v-loading="ruleLoading" :data="ruleCells" border stripe>
          <el-table-column label="位置" width="150" align="center">
            <template slot-scope="scope">{{ cellTitle(scope.row.cellNo) }}</template>
          </el-table-column>
          <el-table-column prop="title" label="格子标题" width="180" align="center" />
          <el-table-column
            prop="content"
            label="规则内容"
            min-width="320"
            show-overflow-tooltip
          />
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{
                scope.row.status === "0" ? "启用" : "停用"
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openRule(scope.row)"
                >编辑</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-if="!ruleLoading && !ruleCells.length"
          description="规则格尚未初始化，请先执行数据库迁移 v45"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      :title="'编辑点数 ' + (pointForm.pointNo || '')"
      :visible.sync="pointDialogVisible"
      width="560px"
      append-to-body
    >
      <el-form ref="pointForm" :model="pointForm" label-width="100px">
        <el-form-item label="骰子点数">
          <span class="dice-badge">{{ pointForm.pointNo }}</span>
          <span class="form-tip">点数固定为 1-6，不可修改</span>
        </el-form-item>
        <el-form-item label="点数名称" required>
          <el-input
            v-model.trim="pointForm.pointName"
            maxlength="50"
            show-word-limit
            placeholder="例如：早八生存"
          />
        </el-form-item>
        <el-form-item label="压力主题">
          <el-input
            v-model.trim="pointForm.theme"
            maxlength="100"
            show-word-limit
            placeholder="例如：早起通勤/固定班次"
          />
        </el-form-item>
        <el-form-item label="职场投射">
          <el-input
            v-model.trim="pointForm.projection"
            maxlength="255"
            show-word-limit
            placeholder="例如：作息规律性、通勤耐受度、对固定班次的接受度"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="pointForm.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="pointDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitPoint"
          >保存</el-button
        >
      </div>
    </el-dialog>

    <el-dialog
      :title="questionForm.questionId ? '编辑试题' : '新增试题'"
      :visible.sync="questionDialogVisible"
      width="680px"
      append-to-body
    >
      <el-form ref="questionForm" :model="questionForm" label-width="80px">
        <el-form-item label="所属点数" required>
          <el-select v-model="questionForm.pointNo" style="width: 100%">
            <el-option
              v-for="point in points"
              :key="point.pointNo"
              :label="point.pointNo + ' · ' + point.pointName"
              :value="point.pointNo"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="题号" required>
          <el-input-number
            v-model="questionForm.questionNo"
            :min="1"
            :max="99"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="题干" required>
          <el-input
            v-model.trim="questionForm.content"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item
          v-for="key in ['A', 'B', 'C', 'D']"
          :key="key"
          :label="key + ' 选项'"
          required
        >
          <el-input
            v-model.trim="questionForm['option' + key]"
            maxlength="300"
            show-word-limit
            :placeholder="key + ' 选项文字'"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="questionForm.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="questionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitQuestion"
          >保存</el-button
        >
      </div>
    </el-dialog>

    <el-dialog
      title="编辑规则格"
      :visible.sync="ruleDialogVisible"
      width="600px"
      append-to-body
    >
      <el-form ref="ruleForm" :model="ruleForm" label-width="100px">
        <el-form-item label="九宫格位置">
          <span>{{ cellTitle(ruleForm.cellNo) }}</span>
          <span class="form-tip">位置固定，不可修改</span>
        </el-form-item>
        <el-form-item label="格子标题" required>
          <el-input
            v-model.trim="ruleForm.title"
            maxlength="50"
            show-word-limit
            placeholder="例如：再来一次"
          />
        </el-form-item>
        <el-form-item label="规则内容">
          <el-input
            v-model.trim="ruleForm.content"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
            placeholder="填写展示给学生的规则说明"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="ruleForm.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitRule"
          >保存</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listPoints,
  savePoint,
  listQuestions,
  saveQuestion,
  deleteQuestion,
  listRuleCells,
  saveRuleCell,
  zcyltzjErrorMessage,
} from "@/api/zcyltzj";

export default {
  name: "ZcyltzjConfig",
  data() {
    return {
      activeTab: "points",
      points: [],
      questions: [],
      questionPointNo: 1,
      ruleCells: [],
      pointLoading: false,
      questionLoading: false,
      ruleLoading: false,
      saving: false,
      pointDialogVisible: false,
      pointForm: {},
      questionDialogVisible: false,
      questionForm: {},
      ruleDialogVisible: false,
      ruleForm: {},
    };
  },
  created() {
    this.loadPoints();
    this.loadRuleCells();
  },
  methods: {
    loadPoints() {
      this.pointLoading = true;
      listPoints()
        .then((res) => {
          this.points = res.data || res.rows || [];
          // 当前选中的点数已被删除或首次加载时，回退到第一个可用点数。
          if (!this.points.some((item) => item.pointNo === this.questionPointNo)) {
            this.questionPointNo = this.points.length ? this.points[0].pointNo : 1;
          }
          this.loadQuestions();
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)))
        .finally(() => {
          this.pointLoading = false;
        });
    },
    loadQuestions() {
      this.questionLoading = true;
      listQuestions({ pointNo: this.questionPointNo })
        .then((res) => {
          this.questions = res.data || res.rows || [];
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)))
        .finally(() => {
          this.questionLoading = false;
        });
    },
    loadRuleCells() {
      this.ruleLoading = true;
      listRuleCells()
        .then((res) => {
          this.ruleCells = res.data || res.rows || [];
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)))
        .finally(() => {
          this.ruleLoading = false;
        });
    },
    cellTitle(cellNo) {
      if (Number(cellNo) === 8) return "下中（第 8 格）";
      if (Number(cellNo) === 9) return "下右（第 9 格）";
      return cellNo == null ? "" : "第 " + cellNo + " 格";
    },
    openRule(row) {
      this.ruleForm = {
        ruleId: row.ruleId,
        cellNo: row.cellNo,
        title: row.title,
        content: row.content,
        status: row.status || "0",
      };
      this.ruleDialogVisible = true;
    },
    submitRule() {
      if (!this.ruleForm.title) {
        this.$modal.msgWarning("请填写规则格标题");
        return;
      }
      this.saving = true;
      saveRuleCell(this.ruleForm)
        .then(() => {
          this.$modal.msgSuccess("规则格已保存");
          this.ruleDialogVisible = false;
          this.loadRuleCells();
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)))
        .finally(() => {
          this.saving = false;
        });
    },
    openPoint(row) {
      this.pointForm = {
        pointNo: row.pointNo,
        pointName: row.pointName,
        theme: row.theme,
        projection: row.projection,
        status: row.status || "0",
      };
      this.pointDialogVisible = true;
    },
    submitPoint() {
      if (!this.pointForm.pointName) {
        this.$modal.msgWarning("请填写点数名称");
        return;
      }
      this.saving = true;
      savePoint(this.pointForm)
        .then(() => {
          this.$modal.msgSuccess("点数设置已保存");
          this.pointDialogVisible = false;
          this.loadPoints();
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)))
        .finally(() => {
          this.saving = false;
        });
    },
    openQuestion(row) {
      if (row) {
        this.questionForm = {
          questionId: row.questionId,
          pointNo: row.pointNo,
          questionNo: row.questionNo,
          content: row.content,
          optionA: row.optionA,
          optionB: row.optionB,
          optionC: row.optionC,
          optionD: row.optionD,
          status: row.status || "0",
        };
      } else {
        const maxNo = this.questions.reduce(
          (max, item) => Math.max(max, Number(item.questionNo) || 0),
          0,
        );
        this.questionForm = {
          questionId: null,
          pointNo: this.questionPointNo,
          questionNo: maxNo + 1,
          content: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          status: "0",
        };
      }
      this.questionDialogVisible = true;
    },
    submitQuestion() {
      const form = this.questionForm;
      if (!form.content) {
        this.$modal.msgWarning("请填写题干");
        return;
      }
      if (!form.optionA || !form.optionB || !form.optionC || !form.optionD) {
        this.$modal.msgWarning("请填写完整的 A、B、C、D 四个选项");
        return;
      }
      this.saving = true;
      saveQuestion(form)
        .then(() => {
          this.$modal.msgSuccess("试题已保存");
          this.questionDialogVisible = false;
          this.questionPointNo = form.pointNo;
          this.loadPoints();
        })
        .catch((error) => this.$modal.msgError(zcyltzjErrorMessage(error)))
        .finally(() => {
          this.saving = false;
        });
    },
    removeQuestion(row) {
      this.$modal
        .confirm("确认删除题号 " + row.questionNo + " 的试题吗？")
        .then(() => deleteQuestion(row.questionId))
        .then(() => {
          this.$modal.msgSuccess("试题已删除");
          this.loadPoints();
        })
        .catch((error) => {
          if (error) this.$modal.msgError(zcyltzjErrorMessage(error));
        });
    },
  },
};
</script>

<style scoped>
.tip {
  margin-bottom: 16px;
}
.dice-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #409eff;
  color: #fff;
  font-weight: 600;
}
.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.question-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.point-radio {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.danger-text {
  color: #f56c6c;
}
/deep/ .el-table th {
  background: #f5f7fa;
}
</style>
