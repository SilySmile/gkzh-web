<template>
  <el-dialog
    title="创业知识答答答环节配置"
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
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" @click="handleConfirm"
                 :disabled="!form.title">确 定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
    name: "CyzsConfig",
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
            },
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
            }
        }
    },
    methods: {
        handleConfirm() {
            this.$emit('confirm', this.form);
            this.dialogVisible = false;
        },
        handleClose() {
            this.dialogVisible = false;
        },
    },
};
</script>
