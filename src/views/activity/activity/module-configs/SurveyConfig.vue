<template>
  <el-dialog
    title="问卷环节配置"
    :visible.sync="dialogVisible"
    width="600px"
    append-to-body
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" ref="form" label-width="120px">
      <el-form-item label="环节标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入环节标题"></el-input>
      </el-form-item>
      <el-form-item label="环节描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入环节描述 (可选)"></el-input>
      </el-form-item>
      <el-form-item label="选择问卷" prop="surveyId">
        <el-select
          v-model="form.surveyId"
          placeholder="请选择要关联的问卷"
          style="width: 100%;"
          popper-class="survey-select-popper"
          @change="handleSurveyChange"
        >
          <el-option
            v-for="survey in surveyList"
            :key="survey.id"
            :label="survey.title"
            :value="survey.id"
          >
            <div class="option-layout">
              <span>{{ survey.title }}</span>
              <span class="option-status">{{ survey.status === '0' ? '启用' : '禁用' }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item v-if="selectedSurvey" label="问卷信息">
        <div class="survey-info">
          <p><strong>问卷标题：</strong>{{ selectedSurvey.title }}</p>
          <p><strong>问卷描述：</strong>{{ selectedSurvey.description || '暂无描述' }}</p>
          <p><strong>题目数量：</strong>{{ selectedSurvey.questionCount || 0 }} 题</p>
          <p><strong>状态：</strong>
            <el-tag :type="selectedSurvey.status === '0' ? 'success' : 'danger'">
              {{ selectedSurvey.status === '0' ? '启用' : '禁用' }}
            </el-tag>
          </p>
        </div>
      </el-form-item>
    </el-form>
    
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" @click="handleConfirm" :disabled="!form.surveyId">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { listSurvey } from "@/api/wjdc/survey";

export default {
  name: "SurveyConfig",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    config: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      form: {
        title: '',
        description: '',
        surveyId: null,
      },
      surveyList: [],
      selectedSurvey: null,
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      },
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.form.title = this.config.title || '';
        this.form.description = this.config.description || '';
        this.form.surveyId = this.config.surveyId || null;
        this.loadSurveyList().then(() => {
          this.$nextTick(() => {
            this.handleSurveyChange();
          });
        });
      }
    }
  },
  methods: {
    async loadSurveyList() {
      try {
        const response = await listSurvey({ pageSize: 1000 });
        this.surveyList = response.rows || [];
      } catch (error) {
        console.error('加载问卷列表失败:', error);
        this.$message.error('加载问卷列表失败');
      }
    },
    handleSurveyChange() {
      console.log('选中的 Survey ID:', this.form.surveyId, '数据类型:', typeof this.form.surveyId);
      if (this.form.surveyId) {
        this.selectedSurvey = this.surveyList.find(s => s.surveyId === this.form.surveyId);
      } else {
        this.selectedSurvey = null;
      }
    },
    handleConfirm() {
      if (!this.form.surveyId) {
        this.$message.warning('请选择一个问卷');
        return;
      }
      this.$emit('confirm', {
        title: this.form.title,
        description: this.form.description,
        surveyId: this.form.surveyId
      });
      this.dialogVisible = false;
    },
    handleClose() {
      this.dialogVisible = false;
    },
  },
};
</script>

<style scoped>
.survey-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}
.survey-info p {
  margin: 8px 0;
  line-height: 1.5;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
.option-layout {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.option-status {
  color: #8492a6;
  font-size: 13px;
}

/deep/ .survey-select-popper .el-select-dropdown__item:not(.selected) {
  color: #606266;
}

/deep/ .survey-select-popper .el-select-dropdown__item:not(.selected) .option-status {
  color: #8492a6;
}
</style> 