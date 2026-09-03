<template>
    <el-dialog
        title="签到环节配置"
        :visible.sync="dialogVisible"
        width="500px"
        append-to-body
        :close-on-click-modal="false"
        @close="handleClose"
    >
        <el-form :model="form" ref="form" label-width="120px">
            <el-form-item label="签到开始时间" prop="startTime">
                <el-time-select
                    placeholder="选择时间"
                    v-model="form.startTime"
                    :picker-options="{
                        start: '00:00',
                        step: '00:15',
                        end: '23:59'
                    }">
                </el-time-select>
            </el-form-item>
            <el-form-item label="签到结束时间" prop="endTime">
                <el-time-select
                    placeholder="选择时间"
                    v-model="form.endTime"
                    :picker-options="{
                        start: '00:00',
                        step: '00:15',
                        end: '23:59',
                        minTime: form.startTime
                    }">
                </el-time-select>
            </el-form-item>
            <!--      <el-form-item label="需要GPS定位" prop="gpsRequired">-->
            <!--        <el-switch v-model="form.gpsRequired"></el-switch>-->
            <!--      </el-form-item>-->
            <el-form-item v-if="form.gpsRequired" label="允许范围(米)"
                          prop="gpsRange">
                <el-input-number v-model="form.gpsRange" :min="10" :max="1000"
                                 label="允许的GPS误差范围"></el-input-number>
            </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
            <el-button @click="handleClose">取 消</el-button>
            <el-button type="primary" @click="handleConfirm">确 定</el-button>
        </div>
    </el-dialog>
</template>

<script>
export default {
    name: "CheckInConfig",
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
                startTime: null,
                endTime: null,
                gpsRequired: false,
                gpsRange: 100,
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
                // 当弹窗显示时，用传入的配置初始化表单
                this.form = {...this.form, ...this.config};
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
