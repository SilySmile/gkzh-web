<template>
  <el-dialog
    title="抽奖环节配置"
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
        <el-input v-model="form.description" type="textarea" :rows="3"
                  placeholder="请输入环节描述 (可选)"></el-input>
      </el-form-item>
      <el-form-item label="选择抽奖活动" prop="lotteryId">
        <el-select v-model="form.lotteryId"
                   placeholder="请选择抽奖活动模板"
                   style="width: 100%"
                   @change="handleLotteryChange"
        >
          <el-option
            v-for="item in lotteryList"
            :key="item.lotteryId"
            :label="item.title"
            :value="item.lotteryId">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" @click="handleConfirm"
                 :disabled="!form.lotteryId">确 定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import {listActivity} from "@/api/lottery/activity";

export default {
  name: "LotteryConfig",
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
        lotteryId: null,
      },
      lotteryList: [],
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
        this.form.lotteryId = this.config.lotteryId || null;
        this.getLotteryList();
      }
    }
  },
  methods: {
    getLotteryList() {
      listActivity({pageSize: 1000}).then(response => {
        this.lotteryList = response.rows || [];
      });
    },
    handleConfirm() {
      this.$emit('confirm', {
        title: this.form.title,
        description: this.form.description,
        lotteryId: this.form.lotteryId,
      });
      this.handleClose();
    },
    handleLotteryChange() {
      console.log('选中的 lotteryId:', this.form.lotteryId, '数据类型:', typeof this.form.lotteryId);
      // if (this.form.lotteryId) {
      //   this.selectedSurvey = this.surveyList.find(s => s.surveyId === this.form.surveyId);
      // } else {
      //   this.selectedSurvey = null;
      // }
    },
    handleClose() {
      this.dialogVisible = false;
    },
  },
};
</script>
