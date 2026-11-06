<template>
  <div class="app-container zycck-config">
    <el-alert
      class="page-tip"
      title="未来职业猜猜看配置"
      type="info"
      :closable="false"
      description="职业资料统一维护；有 A-D 选项的职业为试题，没有选项的职业为探索内容。试题不进入探索墙，固定模式配置 1 个候选题，随机池模式配置 3 个候选题。"
    />
    <el-alert
      v-if="!categoryLoading && !categories.length"
      class="init-tip"
      title="尚未初始化五大职业大类"
      type="warning"
      show-icon
      :closable="false"
      description="请先执行 server/sql/v24_zycck_seed_final_categories.sql 初始化五类大类，初始化完成后点击刷新。"
    />
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="职业大类" name="categories">
        <div class="category-list-head">
          <span>职业大类（五类）</span
          ><el-button
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="openCategoryDialog()"
            >新增大类</el-button
          ><el-button
            size="small"
            icon="el-icon-refresh"
            @click="loadCategories"
            >刷新</el-button
          >
        </div>
        <el-table
          v-if="categories.length"
          v-loading="categoryLoading"
          :data="categories"
          border
          stripe
          class="full-table category-table"
          ><el-table-column
            type="index"
            label="#"
            width="58"
            align="center"
          /><el-table-column
            prop="name"
            label="大类名称"
            min-width="180"
          /><el-table-column
            prop="code"
            label="编码"
            min-width="160"
          /><el-table-column label="抽题模式" width="140" align="center"
            ><template slot-scope="scope"
              ><el-tag
                :type="scope.row.drawMode === 'random' ? 'warning' : 'success'"
                >{{ drawModeText(scope.row.drawMode) }}</el-tag
              ></template
            ></el-table-column
          ><el-table-column
            prop="careerCount"
            label="职业数量"
            width="100"
            align="center"
          /><el-table-column
            prop="questionCount"
            label="题目数量"
            width="100"
            align="center"
          /><el-table-column
            prop="candidateCount"
            label="候选题数"
            width="100"
            align="center"
          /><el-table-column label="状态" width="100" align="center"
            ><template slot-scope="scope"
              ><el-tag
                :type="String(scope.row.status) === '0' ? 'success' : 'info'"
                >{{
                  String(scope.row.status) === "0" ? "启用" : "停用"
                }}</el-tag
              ></template
            ></el-table-column
          ><el-table-column
            label="操作"
            width="150"
            align="center"
            fixed="right"
            ><template slot-scope="scope"
              ><el-button
                type="text"
                size="mini"
                @click="editCategory(scope.row)"
                >编辑</el-button
              ><el-button
                type="text"
                size="mini"
                class="danger-text"
                @click="removeCategory(scope.row)"
                >删除</el-button
              ></template
            ></el-table-column
          ></el-table
        >
        <el-empty
          v-if="!categoryLoading && !categories.length"
          description="暂无职业大类，请先初始化或新增"
        />
        <el-divider v-if="categories.length" content-position="left"
          >职业大类说明：职业数量包含试题职业和探索职业；试题职业不进入探索墙。固定模式需配置 1 道候选题，随机池模式需配置 3 道候选题。</el-divider
        >
      </el-tab-pane>
      <el-tab-pane label="职业维护" name="careers">
        <div class="section-toolbar">
          <div class="toolbar-left">
            <el-select
              v-model="careerQuery.categoryId"
              clearable
              filterable
              size="small"
              placeholder="全部职业大类"
              @change="loadCareers"
              ><el-option
                v-for="item in categories"
                :key="item.categoryId"
                :label="item.name"
                :value="item.categoryId" /></el-select
            ><el-input
              v-model="careerQuery.keyword"
              clearable
              size="small"
              class="keyword"
              placeholder="搜索职业名称"
              @keyup.enter.native="loadCareers"
            /><el-button
              type="primary"
              size="small"
              icon="el-icon-search"
              @click="loadCareers"
              >查询</el-button
            >
          </div>
          <div>
            <el-button
              type="success"
              size="small"
              icon="el-icon-plus"
              @click="openCareerDialog()"
              >新增职业</el-button
            ><el-button size="small" icon="el-icon-refresh" @click="loadCareers"
              >刷新</el-button
            >
          </div>
        </div>
        <el-table
          v-loading="careerLoading"
          :data="careers"
          border
          stripe
          class="full-table"
          ><el-table-column
            type="index"
            label="#"
            width="58"
            align="center"
          /><el-table-column
            prop="categoryName"
            label="职业大类"
            min-width="190"
          /><el-table-column
            prop="careerName"
            label="职业名称"
            min-width="220"
          /><el-table-column label="职业图片" width="110" align="center"
            ><template slot-scope="scope"
              ><el-image
                v-if="scope.row.careerImageUrl"
                :src="scope.row.careerImageUrl"
                fit="cover"
                class="career-thumb"
                :preview-src-list="[scope.row.careerImageUrl]"
              /><span v-else class="empty-image">未设置</span></template
            ></el-table-column
          /><el-table-column label="职业类型" width="150" align="center"
            ><template slot-scope="scope"
              ><el-tag :type="isQuestionCareer(scope.row) ? 'success' : 'info'">{{
                isQuestionCareer(scope.row) ? "试题职业" : "探索职业"
              }}</el-tag></template
            ></el-table-column
          ><el-table-column label="状态" width="100" align="center"
            ><template slot-scope="scope"
              ><el-tag
                :type="String(scope.row.status) === '0' ? 'success' : 'info'"
                >{{
                  String(scope.row.status) === "0" ? "启用" : "停用"
                }}</el-tag
              ></template
            ></el-table-column
          ><el-table-column
            prop="sortOrder"
            label="排序"
            width="80"
            align="center"
          /><el-table-column
            label="操作"
            width="230"
            align="center"
            fixed="right"
            ><template slot-scope="scope"
              ><el-button
                type="text"
                size="mini"
                @click="editCareerQuestion(scope.row)"
                >编辑职业</el-button
              ><el-button
                type="text"
                size="mini"
                @click="editQuestion(scope.row)"
                >编辑题目</el-button
              ><el-button
                type="text"
                size="mini"
                class="danger-text"
                @click="removeCareer(scope.row)"
                >删除职业</el-button
              ></template
            ></el-table-column
          ></el-table
        >
        <el-empty
          v-if="!careerLoading && !careers.length"
          description="暂无职业，请先新增职业"
        />
      </el-tab-pane>
      <el-tab-pane label="题目维护" name="questions">
        <div class="section-toolbar">
          <div class="toolbar-left">
            <el-select
              v-model="questionQuery.categoryId"
              clearable
              filterable
              size="small"
              placeholder="全部职业大类"
              @change="loadQuestions"
              ><el-option
                v-for="item in categories"
                :key="item.categoryId"
                :label="item.name"
                :value="item.categoryId" /></el-select
            ><el-input
              v-model="questionQuery.keyword"
              clearable
              size="small"
              class="keyword"
              placeholder="搜索题干/职业名称"
              @keyup.enter.native="loadQuestions"
            /><el-button
              type="primary"
              size="small"
              icon="el-icon-search"
              @click="loadQuestions"
              >查询</el-button
            >
          </div>
          <div>
            <el-button
              type="success"
              size="small"
              icon="el-icon-plus"
              @click="openQuestionDialog()"
              >新增题目</el-button
            ><el-button
              size="small"
              icon="el-icon-refresh"
              @click="loadQuestions"
              >刷新</el-button
            >
          </div>
        </div>
        <el-table
          v-loading="questionLoading"
          :data="questions"
          border
          stripe
          class="full-table question-table"
          ><el-table-column
            type="index"
            label="#"
            width="58"
            align="center"
          /><el-table-column
            prop="categoryName"
            label="职业大类"
            min-width="190"
          /><el-table-column
            prop="careerName"
            label="绑定职业"
            min-width="180"
          /><el-table-column label="题干/场景图" min-width="280"
            ><template slot-scope="scope"
              ><div class="stem-cell">
                <el-image
                  v-if="scope.row.questionImageUrl"
                  :src="scope.row.questionImageUrl"
                  fit="cover"
                  class="thumb"
                  :preview-src-list="[scope.row.questionImageUrl]"
                /><span>{{
                  scope.row.questionText ||
                  "猜猜以上内容是下面哪个职业的工作场景？"
                }}</span>
              </div></template
            ></el-table-column
          ><el-table-column label="A-D 文本选项" min-width="300"
            ><template slot-scope="scope"
              ><div class="options-cell">
                <span
                  >A.
                  {{
                    scope.row.optionA ||
                    careerName(scope.row.optionACareerId) ||
                    "未设置"
                  }}</span
                ><span
                  >B.
                  {{
                    scope.row.optionB ||
                    careerName(scope.row.optionBCareerId) ||
                    "未设置"
                  }}</span
                ><span
                  >C.
                  {{
                    scope.row.optionC ||
                    careerName(scope.row.optionCCareerId) ||
                    "未设置"
                  }}</span
                ><span
                  >D.
                  {{
                    scope.row.optionD ||
                    careerName(scope.row.optionDCareerId) ||
                    "未设置"
                  }}</span
                >
              </div></template
            ></el-table-column
          ><el-table-column label="正确选项" width="100" align="center"
            ><template slot-scope="scope"
              ><el-tag type="success">{{
                scope.row.correctOptionKey || "-"
              }}</el-tag></template
            ></el-table-column
          ><el-table-column label="候选池" width="100" align="center"
            ><template slot-scope="scope"
              ><el-tag
                :type="
                  isCandidate(scope.row.drawCandidate) ? 'warning' : 'info'
                "
                >{{
                  isCandidate(scope.row.drawCandidate) ? "候选题" : "普通题"
                }}</el-tag
              ></template
            ></el-table-column
          ><el-table-column label="状态" width="100" align="center"
            ><template slot-scope="scope"
              ><el-tag
                :type="String(scope.row.status) === '0' ? 'success' : 'info'"
                >{{
                  String(scope.row.status) === "0" ? "启用" : "停用"
                }}</el-tag
              ></template
            ></el-table-column
          ><el-table-column
            label="操作"
            width="220"
            align="center"
            fixed="right"
            ><template slot-scope="scope"
              ><el-button type="text" size="mini" @click="preview(scope.row)"
                >预览</el-button
              ><el-button
                type="text"
                size="mini"
                @click="editQuestion(scope.row)"
                >编辑</el-button
              ><el-button
                type="text"
                size="mini"
                class="danger-text"
                @click="removeQuestion(scope.row)"
                >删除题目</el-button
              ></template
            ></el-table-column
          ></el-table
        >
        <pagination
          v-show="questionTotal > 0"
          :total="questionTotal"
          :page.sync="questionQuery.pageNum"
          :limit.sync="questionQuery.pageSize"
          @pagination="loadQuestions"
        /><el-empty
          v-if="!questionLoading && !questions.length"
          description="暂无题目，请先维护职业并新增题目"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      :title="categoryForm.categoryId ? '编辑职业大类' : '新增职业大类'"
      :visible.sync="categoryDialogVisible"
      width="560px"
      append-to-body
      ><el-form
        ref="categoryForm"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="100px"
        ><el-form-item label="大类名称" prop="name"
          ><el-input
            v-model="categoryForm.name"
            maxlength="50"
            show-word-limit /></el-form-item
        ><el-form-item label="编码"
          ><el-input
            v-model="categoryForm.code"
            maxlength="32"
            placeholder="选填，留空由系统自动生成" /></el-form-item
        ><el-form-item label="抽题模式" prop="drawMode"
          ><el-radio-group v-model="categoryForm.drawMode"
            ><el-radio label="fixed">固定（1 题）</el-radio
            ><el-radio label="random">随机池（3 题）</el-radio></el-radio-group
          ></el-form-item
        ><el-form-item label="排序"
          ><el-input-number
            v-model="categoryForm.sortOrder"
            :min="1"
            :max="99" /></el-form-item
        ><el-form-item label="状态"
          ><el-switch v-model="categoryEnabled" /></el-form-item
      ></el-form>
      <div slot="footer">
        <el-button @click="categoryDialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="saving" @click="submitCategory"
          >保存</el-button
        >
      </div></el-dialog
    >

    <el-dialog
      :title="careerForm.careerQuestionId ? '编辑职业' : '新增职业'"
      :visible.sync="careerDialogVisible"
      width="760px"
      append-to-body
      ><el-form
        ref="careerForm"
        :model="careerForm"
        :rules="careerRules"
        label-width="100px"
        ><el-form-item label="职业大类" prop="categoryId"
          ><el-select
            v-model="careerForm.categoryId"
            filterable
            placeholder="请选择职业大类"
            style="width: 100%"
            ><el-option
              v-for="item in categories"
              :key="item.categoryId"
              :label="item.name"
              :value="item.categoryId" /></el-select></el-form-item
        ><el-form-item label="职业名称" prop="careerName"
          ><el-input
            v-model="careerForm.careerName"
            maxlength="100"
            show-word-limit /></el-form-item
        ><el-form-item label="职业图片"
          ><ImageUpload
            v-model="careerForm.careerImageUrl"
            :limit="1"
            :file-size="2"
            :file-type="['jpg', 'jpeg', 'png']"
          />
          <div class="form-tip image-resolution-tip">
            建议上传 1:1 或 4:3 的 JPG/PNG 图片，单张不超过 2MB。图片将显示在学生端职业卡片、职业详情和探索报告中。
          </div></el-form-item
        ><el-form-item label="职业类型" prop="hasQuestion"
          ><el-select
            v-model="careerForm.hasQuestion"
            style="width: 100%"
            @change="careerTypeChanged"
            ><el-option label="探索职业（无题目）" value="0" />
            <el-option label="试题职业（有题目）" value="1" /></el-select
          ><div class="form-tip">
            试题职业需要在“题目维护”中补充 A-D 选项；切换为探索职业后会清空该职业的题目选项和候选题标记。
          </div></el-form-item
        ><el-form-item label="一句话介绍"
          ><el-input
            v-model="careerForm.oneLineIntro"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit /></el-form-item
        ><el-form-item label="主要做什么"
          ><el-input
            v-model="careerForm.mainWork"
            type="textarea"
            :rows="3"
            maxlength="2000"
            show-word-limit /></el-form-item
        ><el-form-item label="一天可能做什么"
          ><el-input
            v-model="careerForm.dayExample"
            type="textarea"
            :rows="4"
            maxlength="2000"
            show-word-limit /></el-form-item
        ><el-form-item label="为什么会有这样的职业"
          ><el-input
            v-model="careerForm.whyExists"
            type="textarea"
            :rows="4"
            maxlength="2000"
            show-word-limit /></el-form-item
        ><el-form-item label="排序"
          ><el-input-number
            v-model="careerForm.sortOrder"
            :min="1"
            :max="999" /></el-form-item
        ><el-form-item label="状态">
          <el-switch v-model="careerEnabled"
        /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="careerDialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="saving" @click="submitCareer"
          >保存</el-button
        >
      </div></el-dialog
    >

    <el-dialog
      :title="questionForm.careerQuestionId ? '编辑题目' : '新增题目'"
      :visible.sync="questionDialogVisible"
      width="820px"
      append-to-body
      ><el-alert
        title="题目规则"
        type="info"
        :closable="false"
        class="dialog-tip"
        description="有 A-D 选项的记录才是试题；A-D 为题目文本，只有正确答案需要绑定职业。"
      /><el-form
        ref="questionForm"
        :model="questionForm"
        :rules="questionRules"
        label-width="110px"
        size="small"
        ><el-form-item label="职业大类" prop="categoryId"
          ><el-select
            v-model="questionForm.categoryId"
            filterable
            placeholder="请选择职业大类"
            style="width: 100%"
            @change="questionCategoryChanged"
            ><el-option
              v-for="item in categories"
              :key="item.categoryId"
              :label="item.name + '（' + drawModeText(item.drawMode) + '）'"
              :value="item.categoryId" /></el-select></el-form-item
        ><el-form-item label="正确答案职业" prop="careerQuestionId"
          ><el-select
            v-model="questionForm.careerQuestionId"
            filterable
            placeholder="请选择本题绑定职业"
            style="width: 100%"
            ><el-option
              v-for="career in categoryCareerOptions"
              :key="career.careerQuestionId"
              :label="career.careerName"
              :value="career.careerQuestionId" /></el-select></el-form-item
        ><el-form-item label="题干"
          ><el-input
            v-model="questionForm.questionText"
            type="textarea"
            :rows="2"
            maxlength="300"
            show-word-limit
            placeholder="不填写时使用默认题干" /></el-form-item
        ><el-form-item label="题目场景图"
          ><ImageUpload
            v-model="questionForm.questionImageUrl"
            :limit="1" />
          <div class="form-tip image-resolution-tip">
            推荐分辨率：750 × 760 px（接近 1:1 竖版）；支持 JPG/PNG，单张不超过 2MB。用户端按卡片比例等比展示，请避免上传过宽或过长的图片。
          </div></el-form-item
        ><el-divider content-position="left">题目选项（文本输入）</el-divider
        ><el-row v-for="option in optionRows" :key="option.key" :gutter="12"
          ><el-col :span="24"
            ><el-form-item :label="'选项 ' + option.label" :prop="option.text"
              ><el-input
                v-model="questionForm[option.text]"
                type="textarea"
                :rows="2"
                maxlength="300"
                show-word-limit
                :placeholder="'请输入选项' + option.label + '内容'"
              /></el-form-item></el-col></el-row
        ><el-form-item label="正确选项" prop="correctOptionKey"
          ><el-radio-group v-model="questionForm.correctOptionKey"
            ><el-radio v-for="key in optionKeys" :key="key" :label="key">{{
              key
            }}</el-radio></el-radio-group
          ></el-form-item
        ><el-form-item label="候选池"
          ><el-switch v-model="questionForm.drawCandidate" /></el-form-item
        ><el-form-item label="状态"
          ><el-switch v-model="questionEnabled" /></el-form-item
      ></el-form>
      <div slot="footer">
        <el-button @click="questionDialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="saving" @click="submitQuestion"
          >保存</el-button
        >
      </div></el-dialog
    >

    <el-dialog
      title="题目预览"
      :visible.sync="previewVisible"
      width="660px"
      append-to-body
      ><div v-if="previewQuestion" class="question-preview">
        <el-tag type="info">{{
          previewQuestion.categoryName ||
          categoryName(previewQuestion.categoryId)
        }}</el-tag>
        <h3>
          {{
            previewQuestion.questionText ||
            "猜猜以上内容是下面哪个职业的工作场景？"
          }}
        </h3>
        <el-image
          v-if="previewQuestion.questionImageUrl"
          :src="previewQuestion.questionImageUrl"
          fit="contain"
          class="preview-image"
          :preview-src-list="[previewQuestion.questionImageUrl]"
        />
        <div
          v-for="item in previewOptions"
          :key="item.key"
          class="preview-option"
        >
          {{ item.key }}. {{ item.text || careerName(item.careerId) || "未设置"
          }}<el-tag
            v-if="item.key === previewQuestion.correctOptionKey"
            size="mini"
            type="success"
            >正确答案</el-tag
          >
        </div>
      </div></el-dialog
    >
  </div>
</template>

<script>
import {
  listCategories,
  saveCategory,
  deleteCategory,
  listCareerQuestions,
  saveCareerQuestion,
  deleteCareerQuestion,
  zycckErrorMessage,
} from "@/api/zycck";
const emptyQuestion = () => ({
  categoryId: null,
  careerQuestionId: null,
  careerName: "",
  hasQuestion: "1",
  questionText: "",
  questionImageUrl: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  optionACareerId: null,
  optionBCareerId: null,
  optionCCareerId: null,
  optionDCareerId: null,
  correctOptionKey: "A",
  drawCandidate: false,
  status: "0",
  sortOrder: 1,
});
export default {
  name: "ZycckConfig",
  data() {
    return {
      activeTab: "categories",
      categoryLoading: false,
      careerLoading: false,
      questionLoading: false,
      saving: false,
      categories: [],
      careers: [],
      questions: [],
      allQuestions: [],
      questionTotal: 0,
      categoryDialogVisible: false,
      careerDialogVisible: false,
      questionDialogVisible: false,
      previewVisible: false,
      previewQuestion: null,
      categoryForm: {},
      careerForm: {},
      questionForm: emptyQuestion(),
      careerQuery: { categoryId: null, keyword: null },
      questionQuery: {
        pageNum: 1,
        pageSize: 10,
        categoryId: null,
        keyword: null,
      },
      optionKeys: ["A", "B", "C", "D"],
      optionRows: [
        { key: "A", label: "A", text: "optionA", career: "optionACareerId" },
        { key: "B", label: "B", text: "optionB", career: "optionBCareerId" },
        { key: "C", label: "C", text: "optionC", career: "optionCCareerId" },
        { key: "D", label: "D", text: "optionD", career: "optionDCareerId" },
      ],
      categoryRules: {
        name: [{ required: true, message: "请输入大类名称", trigger: "blur" }],
        drawMode: [
          { required: true, message: "请选择抽题模式", trigger: "change" },
        ],
      },
      careerRules: {
        categoryId: [
          { required: true, message: "请选择职业大类", trigger: "change" },
        ],
        careerName: [
          { required: true, message: "请输入职业名称", trigger: "blur" },
        ],
      },
      questionRules: {
        categoryId: [
          { required: true, message: "请选择职业大类", trigger: "change" },
        ],
        careerQuestionId: [
          { required: true, message: "请选择绑定职业", trigger: "change" },
        ],
        correctOptionKey: [
          { required: true, message: "请选择正确选项", trigger: "change" },
        ],
        optionA: [
          { required: true, message: "请输入选项A内容", trigger: "blur" },
        ],
        optionB: [
          { required: true, message: "请输入选项B内容", trigger: "blur" },
        ],
        optionC: [
          { required: true, message: "请输入选项C内容", trigger: "blur" },
        ],
        optionD: [
          { required: true, message: "请输入选项D内容", trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    categoryEnabled: {
      get() {
        return String(this.categoryForm.status || "0") === "0";
      },
      set(value) {
        this.categoryForm.status = value ? "0" : "1";
      },
    },
    careerEnabled: {
      get() {
        return String(this.careerForm.status || "0") === "0";
      },
      set(value) {
        this.careerForm.status = value ? "0" : "1";
      },
    },
    questionEnabled: {
      get() {
        return String(this.questionForm.status || "0") === "0";
      },
      set(value) {
        this.questionForm.status = value ? "0" : "1";
      },
    },
    careerOptions() {
      return this.allQuestions.filter(
        (item) => String(item.status == null ? "0" : item.status) === "0",
      );
    },
    categoryCareerOptions() {
      return this.allQuestions.filter(
        (item) =>
          this.isQuestionCareer(item) &&
          String(item.categoryId) === String(this.questionForm.categoryId),
      );
    },
    previewOptions() {
      return this.optionRows.map((item) => ({
        key: item.key,
        text: this.previewQuestion && this.previewQuestion[item.text],
        careerId: this.previewQuestion && this.previewQuestion[item.career],
      }));
    },
  },
  created() {
    this.loadCategories();
  },
  methods: {
    categoryName(id) {
      const item = this.categories.find(
        (category) => String(category.categoryId) === String(id),
      );
      return item ? item.name : "";
    },
    drawModeText(mode) {
      return mode === "random" ? "随机池，需3题" : "固定，需1题";
    },
    isCandidate(value) {
      return value === true || value === 1 || String(value) === "1";
    },
    isQuestionCareer(row) {
      return String(row && row.hasQuestion == null ? "1" : row && row.hasQuestion) === "1";
    },
    careerTypeChanged(value) {
      if (String(value) !== "0") return;
      this.careerForm.optionA = null;
      this.careerForm.optionB = null;
      this.careerForm.optionC = null;
      this.careerForm.optionD = null;
      this.careerForm.optionACareerId = null;
      this.careerForm.optionBCareerId = null;
      this.careerForm.optionCCareerId = null;
      this.careerForm.optionDCareerId = null;
      this.careerForm.correctOptionKey = null;
      this.careerForm.drawCandidate = "0";
    },
    careerName(id) {
      const item = this.allQuestions.find(
        (career) => String(career.careerQuestionId) === String(id),
      );
      return item ? item.careerName : "";
    },
    loadCategories() {
      this.categoryLoading = true;
      listCategories({ pageNum: 1, pageSize: 50, gameType: "zycck" })
        .then((res) => {
          this.categories = res.rows || res.data || [];
          this.loadAllQuestions();
          this.loadCareers();
          this.loadQuestions();
        })
        .catch((error) => this.$modal.msgError(zycckErrorMessage(error)))
        .finally(() => {
          this.categoryLoading = false;
        });
    },
    loadAllQuestions() {
      return listCareerQuestions({
        pageNum: 1,
        pageSize: 1000,
        gameType: "zycck",
      })
        .then((res) => {
          this.allQuestions = res.rows || res.data || [];
        })
        .catch((error) => this.$modal.msgError(zycckErrorMessage(error)));
    },
    loadCareers() {
      this.careerLoading = true;
      listCareerQuestions({
        pageNum: 1,
        pageSize: 1000,
        categoryId: this.careerQuery.categoryId,
        keyword: this.careerQuery.keyword,
        gameType: "zycck",
      })
        .then((res) => {
          const rows = res.rows || res.data || [];
          this.careers = rows.map((item) => ({
            ...item,
            categoryName:
              item.categoryName || this.categoryName(item.categoryId),
          }));
        })
        .catch((error) => this.$modal.msgError(zycckErrorMessage(error)))
        .finally(() => {
          this.careerLoading = false;
        });
    },
    loadQuestions() {
      this.questionLoading = true;
      listCareerQuestions({ ...this.questionQuery, hasQuestion: 1, gameType: "zycck" })
        .then((res) => {
          const rows = res.rows || res.data || [];
          this.questions = rows.map((item) => ({
            ...item,
            categoryName:
              item.categoryName || this.categoryName(item.categoryId),
          }));
          this.questionTotal = res.total || this.questions.length;
        })
        .catch((error) => this.$modal.msgError(zycckErrorMessage(error)))
        .finally(() => {
          this.questionLoading = false;
        });
    },
    openCategoryDialog(row) {
      this.categoryForm = row
        ? { ...row }
        : {
            categoryId: null,
            code: "",
            name: "",
            drawMode: "fixed",
            sortOrder: this.categories.length + 1,
            status: "0",
          };
      this.categoryDialogVisible = true;
      this.$nextTick(
        () =>
          this.$refs.categoryForm && this.$refs.categoryForm.clearValidate(),
      );
    },
    editCategory(row) {
      this.openCategoryDialog(row);
    },
    submitCategory() {
      this.$refs.categoryForm.validate((valid) => {
        if (!valid) return;
        this.saving = true;
        saveCategory({ ...this.categoryForm })
          .then(() => {
            this.$modal.msgSuccess("职业大类保存成功");
            this.categoryDialogVisible = false;
            return this.loadCategories();
          })
          .catch((error) => this.$modal.msgError(zycckErrorMessage(error)))
          .finally(() => {
            this.saving = false;
          });
      });
    },
    removeCategory(row) {
      if ((row.questionCount || 0) > 0)
        return this.$modal.msgWarning(
          "该职业大类下仍有 " +
            row.questionCount +
            " 个职业/题目，请先删除或迁移后再删除大类",
        );
      this.$modal
        .confirm("确认删除职业大类“" + row.name + "”？")
        .then(() => deleteCategory(row.categoryId))
        .then(() => {
          this.$modal.msgSuccess("职业大类已删除");
          this.loadCategories();
        })
        .catch((error) => {
          if (error) this.$modal.msgError(zycckErrorMessage(error));
        });
    },
    openCareerDialog(row) {
      this.careerForm = row
        ? { ...row }
        : {
            categoryId: this.careerQuery.categoryId,
            careerQuestionId: null,
            careerName: "",
            careerImageUrl: "",
            hasQuestion: "0",
            sortOrder: this.careers.length + 1,
            status: "0",
          };
      this.careerDialogVisible = true;
      this.$nextTick(
        () => this.$refs.careerForm && this.$refs.careerForm.clearValidate(),
      );
    },
    editCareerQuestion(row) {
      this.openCareerDialog(row);
    },
    submitCareer() {
      this.$refs.careerForm.validate((valid) => {
        if (!valid) return;
        this.saving = true;
        saveCareerQuestion({
          ...this.careerForm,
          gameType: "zycck",
          careerOnly: true,
        })
          .then(() => {
            this.$modal.msgSuccess("职业保存成功");
            this.careerDialogVisible = false;
            return this.loadAllQuestions();
          })
          .then(() => {
            this.loadCareers();
            this.loadQuestions();
          })
          .catch((error) => this.$modal.msgError(zycckErrorMessage(error)))
          .finally(() => {
            this.saving = false;
          });
      });
    },
    openQuestionDialog(row) {
      this.questionForm = row
        ? {
            ...emptyQuestion(),
            ...row,
            drawCandidate: this.isCandidate(row.drawCandidate),
          }
        : emptyQuestion();
      if (!this.questionForm.categoryId && this.questionQuery.categoryId)
        this.questionForm.categoryId = this.questionQuery.categoryId;
      this.questionDialogVisible = true;
      this.$nextTick(
        () =>
          this.$refs.questionForm && this.$refs.questionForm.clearValidate(),
      );
    },
    editQuestion(row) {
      this.activeTab = "questions";
      this.openQuestionDialog(row);
    },
    questionCategoryChanged() {
      if (
        !this.questionForm.careerQuestionId ||
        !this.categoryCareerOptions.some(
          (item) =>
            String(item.careerQuestionId) ===
            String(this.questionForm.careerQuestionId),
        )
      )
        this.questionForm.careerQuestionId = null;
    },
    submitQuestion() {
      this.$refs.questionForm.validate((valid) => {
        if (!valid) return;
        const optionTexts = this.optionRows.map((item) =>
          String(this.questionForm[item.text] || "").trim(),
        );
        if (optionTexts.some((text) => !text))
          return this.$modal.msgWarning("四个选项内容不能为空");
        const category = this.categories.find(
          (item) =>
            String(item.categoryId) === String(this.questionForm.categoryId),
        );
        const count =
          this.allQuestions.filter(
            (item) =>
              this.isCandidate(item.drawCandidate) &&
              String(item.categoryId) ===
                String(this.questionForm.categoryId) &&
              String(item.careerQuestionId) !==
                String(this.questionForm.careerQuestionId),
          ).length + (this.questionForm.drawCandidate ? 1 : 0);
        const required = category && category.drawMode === "random" ? 3 : 1;
        if (count > required)
          return this.$modal.msgWarning(
            this.drawModeText(category && category.drawMode) +
              "，候选题不能超过 " +
              required +
              " 道",
          );
        const boundCareer = this.allQuestions.find(
          (item) =>
            String(item.careerQuestionId) ===
            String(this.questionForm.careerQuestionId),
        );
        const payload = {
          ...this.questionForm,
          hasQuestion: "1",
          careerName: boundCareer
            ? boundCareer.careerName
            : this.questionForm.careerName,
          optionA: optionTexts[0],
          optionB: optionTexts[1],
          optionC: optionTexts[2],
          optionD: optionTexts[3],
          // 只有正确选项绑定职业，其余选项只保存文本。
          optionACareerId: this.questionForm.correctOptionKey === "A" ? this.questionForm.careerQuestionId : null,
          optionBCareerId: this.questionForm.correctOptionKey === "B" ? this.questionForm.careerQuestionId : null,
          optionCCareerId: this.questionForm.correctOptionKey === "C" ? this.questionForm.careerQuestionId : null,
          optionDCareerId: this.questionForm.correctOptionKey === "D" ? this.questionForm.careerQuestionId : null,
          drawCandidate: this.questionForm.drawCandidate ? "1" : "0",
          gameType: "zycck",
        };
        this.saving = true;
        saveCareerQuestion(payload)
          .then(() => {
            this.$modal.msgSuccess("题目保存成功");
            this.questionDialogVisible = false;
            return this.loadAllQuestions();
          })
          .then(() => {
            this.loadCareers();
            this.loadQuestions();
          })
          .catch((error) => this.$modal.msgError(zycckErrorMessage(error)))
          .finally(() => {
            this.saving = false;
          });
      });
    },
    removeCareer(row) {
      if (this.isQuestionCareer(row))
        return this.$modal.msgWarning(
          "该职业已绑定题目，删除职业会影响题目，请先删除对应题目",
        );
      this.$modal
        .confirm("确认删除职业“" + row.careerName + "”？删除后不可恢复。")
        .then(() => deleteCareerQuestion(row.careerQuestionId, { careerOnly: true }))
        .then(() => {
          this.$modal.msgSuccess("职业已删除");
          this.loadAllQuestions().then(() => {
            this.loadCareers();
            this.loadQuestions();
          });
        })
        .catch((error) => {
          if (error) this.$modal.msgError(zycckErrorMessage(error));
        });
    },
    removeQuestion(row) {
      this.$modal
        .confirm(
          "确认删除题目“" + (row.careerName || "") + "”？删除后不可恢复。",
        )
        .then(() => deleteCareerQuestion(row.careerQuestionId))
        .then(() => {
          this.$modal.msgSuccess("题目已删除");
          this.loadAllQuestions().then(() => {
            this.loadCareers();
            this.loadQuestions();
          });
        })
        .catch((error) => {
          if (error) this.$modal.msgError(zycckErrorMessage(error));
        });
    },
    selectCategory(id) {
      this.careerQuery.categoryId = id;
      this.loadCareers();
    },
    selectQuestionCategory(id) {
      this.questionQuery.categoryId = id;
      this.loadQuestions();
    },
    preview(row) {
      this.previewQuestion = row;
      this.previewVisible = true;
    },
  },
};
</script>

<style scoped>
.page-tip {
  margin-bottom: 16px;
}
.init-tip {
  margin-bottom: 16px;
}
.category-list-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 12px;
  font-size: 15px;
  font-weight: 600;
}
.category-list-head span {
  margin-right: auto;
}
.category-table {
  margin-bottom: 14px;
}
.danger-text {
  color: #f56c6c;
}
.career-thumb {
  width: 64px;
  height: 52px;
  border-radius: 6px;
  vertical-align: middle;
}
.empty-image {
  color: #a8abb2;
  font-size: 12px;
}
.category-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  overflow-x: auto;
}
.category-card {
  flex: 1 0 170px;
  cursor: pointer;
  border-top: 3px solid #dcdfe6;
}
.category-card.active {
  border-top-color: #409eff;
}
.category-card-name {
  font-size: 16px;
  font-weight: 600;
}
.category-card-meta {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
.section-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-left .el-select {
  width: 220px;
}
.keyword {
  width: 240px;
}
.full-table {
  width: 100%;
}
.question-table .cell {
  white-space: normal;
  line-height: 1.5;
}
.stem-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
}
.thumb {
  width: 52px;
  height: 42px;
  flex: 0 0 52px;
  border-radius: 4px;
  background: #f5f7fa;
}
.options-cell {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 14px;
  color: #606266;
}
.dialog-tip {
  margin-bottom: 16px;
}
.form-tip {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}
.question-preview h3 {
  margin: 14px 0;
}
.preview-image {
  display: block;
  width: 100%;
  height: 220px;
  margin-bottom: 14px;
  background: #f5f7fa;
}
.preview-option {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  margin: 6px 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
/deep/ .el-tag {
  text-align: center;
}
@media (max-width: 900px) {
  .section-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .toolbar-left {
    flex-wrap: wrap;
    width: 100%;
  }
  .keyword {
    flex: 1;
    min-width: 160px;
  }
}
</style>
