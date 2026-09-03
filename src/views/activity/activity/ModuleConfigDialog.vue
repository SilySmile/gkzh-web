<template>
    <el-dialog
        title="活动关卡配置"
        :visible.sync="dialogVisible"
        width="70%"
        :close-on-click-modal="false"
        @close="handleClose"
    >
        <div class="module-config-container">
            <!-- 左侧：环节库 -->
            <div class="toolbox">
                <div class.heading>环节库</div>
                <draggable
                    class="draggable-list"
                    :list="availableModules"
                    :group="{ name: 'modules', pull: 'clone', put: false }"
                    :clone="cloneModule"
                >
                    <div class="module-item" v-for="module in availableModules"
                         :key="module.type">
                        <i :class="module.icon"></i>
                        <span>{{ module.name }}</span>
                    </div>
                </draggable>
            </div>

            <!-- 右侧：活动流程 -->
            <div class="timeline">
                <div class="heading">活动流程</div>
                <draggable
                    class="draggable-list"
                    :list="configuredModules"
                    group="modules"
                    handle=".handle"
                >
                    <div class="configured-item"
                         v-for="(module, index) in configuredModules"
                         :key="module.id">
                        <i class="el-icon-rank handle"></i>
                        <div class="module-info">
                            <span class="module-name">{{
                                    module.title || module.name
                                }}</span>
                            <!--              <el-switch-->
                            <!--                v-model="module.isBlocking"-->
                            <!--                active-text="阻塞环节"-->
                            <!--                inactive-text="普通环节"-->
                            <!--                class="blocking-switch"-->
                            <!--              ></el-switch>-->
                        </div>
                        <div class="module-actions">
                            <el-button
                                v-if="!isFixedModule(module.type)"
                                type="text"
                                icon="el-icon-setting"
                                @click="handleModuleConfig(module, index)"
                            >配置
                            </el-button>
                            <el-button
                                type="text"
                                icon="el-icon-view"
                                @click="handlePreviewModuleQRCode(module)"
                                v-if="activityData && activityData.activityId"
                            >二维码</el-button>
                            <el-button type="text" icon="el-icon-delete"
                                       @click="handleModuleDelete(index)">删除
                            </el-button>
                        </div>
                    </div>
                </draggable>
                <div v-if="configuredModules.length === 0" class="empty-state">
                    从左侧拖拽环节到此处
                </div>
            </div>
        </div>

        <check-in-config
            :visible.sync="checkInConfigVisible"
            :config="currentModuleConfig"
            @confirm="handleCheckInConfigConfirm"
        ></check-in-config>

        <survey-config
            :visible.sync="surveyConfigVisible"
            :config="currentModuleConfig"
            @confirm="handleSurveyConfigConfirm"
        ></survey-config>

        <mind-window-config
            :visible.sync="mindWindowConfigVisible"
            :config="currentModuleConfig"
            @confirm="handleMindWindowConfigConfirm"
        ></mind-window-config>

        <lottery-config
            :visible.sync="lotteryConfigVisible"
            :config="currentModuleConfig"
            @confirm="handleLotteryConfigConfirm"
        ></lottery-config>
        <wjyd-config
            :visible.sync="wjydConfigVisible"
            :config="currentModuleConfig"
            @confirm="handleWjydConfigConfirm"
        ></wjyd-config>
        <cyzs-config
            :visible.sync="cyzsConfigVisible"
            :config="currentModuleConfig"
            @confirm="handleCyzsConfigConfirm"
        ></cyzs-config>
		<zytj-config
		            :visible.sync="zytjConfigVisible"
		            :config="currentModuleConfig"
		            @confirm="handleZytjConfigConfirm"
		        ></zytj-config>
				
		<zyxxz-config
				    :visible.sync="zyxxzConfigVisible"
				    :config="currentModuleConfig"
				    @confirm="handleZyxxzConfigConfirm"
				></zyxxz-config>
        <!-- 新增：模块二维码预览弹窗 -->
        <el-dialog
            :title="moduleQRCodeDialog.title"
            :visible.sync="moduleQRCodeDialog.visible"
            width="400px"
            append-to-body
        >
            <div style="text-align: center;">
                <img
                    :src="moduleQRCodeDialog.qrCodeUrl"          style="max-width: 300px; max-height: 300px; border: 1px solid #ddd; border-radius: 8px;"
                    alt="关卡二维码"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                    onload="this.nextElementSibling.style.display='none';"
                />
                <div style="display: none; color: #f56c6c; font-size: 14px; margin-top: 20px;">
                    <p>二维码加载失败</p>
                    <p style="font-size: 12px; color: #999;">请检查网络连接或联系管理员</p>
                </div>
                <p style="margin-top: 10px; color: #666;">
                    {{ moduleQRCodeDialog.moduleInfo }}
                </p>
                <p style="margin-top: 5px; color: #999; font-size: 12px;">
                    扫描二维码可进入关卡页面
                </p>
            </div>
            <div slot="footer" class="dialog-footer">
                <el-button @click="moduleQRCodeDialog.visible = false">关闭</el-button>
                <el-button type="primary" @click="handleDownloadModuleQRCode">下载</el-button>
            </div>
        </el-dialog>
        <div slot="footer" class="dialog-footer">
            <el-button @click="handleClose">取 消</el-button>
            <el-button type="primary" @click="handleConfirm">确 定</el-button>
        </div>
    </el-dialog>


</template>

<script>
import draggable from 'vuedraggable';
import CheckInConfig from './module-configs/CheckInConfig.vue';
import SurveyConfig from './module-configs/SurveyConfig.vue';
import MindWindowConfig from './module-configs/MindWindowConfig.vue';
import LotteryConfig from './module-configs/LotteryConfig.vue';
import WjydConfig from './module-configs/WjydConfig.vue';
import CyzsConfig from "./module-configs/CyzsConfig.vue";
import ZytjConfig from './module-configs/ZytjConfig.vue';
import ZyxxzConfig from './module-configs/ZyxxzConfig.vue';
export default {
    name: "ModuleConfigDialog",
    components: {
        draggable,
        CheckInConfig,
        SurveyConfig,
        MindWindowConfig,
        LotteryConfig,
        WjydConfig,
        CyzsConfig,
		ZytjConfig,
		ZyxxzConfig,
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
        activityData: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            // 可用的环节模块
            availableModules: [
                {
                    type: 'check-in',
                    name: '签到',
                    icon: 'el-icon-s-claim',
                    isBlocking: true
                },
                {
                    type: 'check-out',
                    name: '签退',
                    icon: 'el-icon-s-unfold',
                    isBlocking: true
                },
                {
                    type: 'lottery',
                    name: '抽奖',
                    icon: 'el-icon-present',
                    isBlocking: false
                },
                {
                    type: 'survey',
                    name: '问卷',
                    icon: 'el-icon-s-order',
                    isBlocking: false
                },
                {
                    type: 'mind-window',
                    name: '心愿橱窗',
                    icon: 'el-icon-s-opportunity',
                    isBlocking: false
                },
                {
                    type: 'wjyd',
                    name: '职场危机应对',
                    icon: 'el-icon-guide',
                    isBlocking: false
                },
                {
                    type: 'cyzs',
                    name: '创业知识答答答',
                    icon: 'el-icon-reading',
                    isBlocking: false
                },
				{
				    type: 'zytj',
				    name: '职愿探究',
				    icon: 'el-icon-s-management',
				    isBlocking: false
				},
				{
								    type: 'zyxxz',
								    name: '职业信息站',
								    icon: 'el-icon-s-data',
								    isBlocking: false
								},
            ],
            // 已配置的环节
            configuredModules: [],
            checkInConfigVisible: false,
            surveyConfigVisible: false,
            mindWindowConfigVisible: false,
            lotteryConfigVisible: false,
            wjydConfigVisible: false,
            cyzsConfigVisible: false,
			zytjConfigVisible: false,
			zyxxzConfigVisible: false,
            currentModuleConfig: {},
            currentModuleIndex: -1,
            // 新增：模块二维码弹窗数据
            moduleQRCodeDialog: {
                visible: false,
                title: '',
                qrCodeUrl: '',
                moduleInfo: '',
                moduleId: null,
                moduleType:'',
            }
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
                this.loadConfig();
            }
        }
    },
    methods: {
        // 加载已有的配置
        loadConfig() {
            if (this.activityData && this.activityData.moduleConfig) {
                try {
                    this.configuredModules = JSON.parse(this.activityData.moduleConfig);
                } catch (e) {
                    console.error("解析环节配置失败:", e);
                    this.configuredModules = [];
                }
            } else {
                this.configuredModules = [];
            }
        },
        // 克隆模块时生成唯一ID和默认的标题描述
        cloneModule(module) {
            return {
                ...module,
                id: `module_${new Date().getTime()}`,
                // 确保新模块有默认标题，以便在卡片上显示
                title: module.name,
            };
        },
        // 处理环节配置
        handleModuleConfig(module, index) {
            this.currentModuleIndex = index;
            this.currentModuleConfig = {...(module.config || {})};

            if (module.type === 'survey') {
                this.surveyConfigVisible = true;
            } else if (module.type === 'mind-window') {
                this.mindWindowConfigVisible = true;
            } else if (module.type === 'lottery') {
                this.lotteryConfigVisible = true;
            } else if (module.type === 'check-in') {
                this.checkInConfigVisible = true;
            } else if(module.type === 'wjyd'){
                this.wjydConfigVisible = true;
            } else if(module.type === 'cyzs'){
                this.cyzsConfigVisible = true;
            } else if(module.type === 'zytj'){
                this.zytjConfigVisible = true;
            }else if(module.type === 'zyxxz'){
                this.zyxxzConfigVisible = true;
            }
            else {
                this.$message.info(`【${module.name}】环节暂无更多配置`);
            }
        },
        // 删除一个环节
        handleModuleDelete(index) {
            this.configuredModules.splice(index, 1);
        },
        // 点击确认
        handleConfirm() {
            const configJson = JSON.stringify(this.configuredModules);
            this.$emit('confirm', configJson);
            this.dialogVisible = false;
        },
        // 点击关闭或取消
        handleClose() {
            this.dialogVisible = false;
        },
        handleCheckInConfigConfirm(newConfig) {
            if (this.currentModuleIndex > -1) {
                const moduleToUpdate = this.configuredModules[this.currentModuleIndex];
                this.$set(moduleToUpdate, 'config', newConfig);
            }
            this.checkInConfigVisible = false;
        },
        handleSurveyConfigConfirm(newConfig) {
            if (this.currentModuleIndex > -1) {
                const moduleToUpdate = this.configuredModules[this.currentModuleIndex];
                this.$set(moduleToUpdate, 'config', newConfig);
            }
            this.surveyConfigVisible = false;
        },
        handleMindWindowConfigConfirm(newConfig) {
            if (this.currentModuleIndex > -1) {
                const moduleToUpdate = this.configuredModules[this.currentModuleIndex];
                this.$set(moduleToUpdate, 'config', newConfig);
            }
            this.mindWindowConfigVisible = false;
        },
        handleWjydConfigConfirm(newConfig) {
            if (this.currentModuleIndex > -1) {
                const moduleToUpdate = this.configuredModules[this.currentModuleIndex];
                this.$set(moduleToUpdate, 'config', newConfig);
            }
            this.wjydConfigVisible = false;
        },
        handleCyzsConfigConfirm(newConfig) {
            if (this.currentModuleIndex > -1) {
                const moduleToUpdate = this.configuredModules[this.currentModuleIndex];
                this.$set(moduleToUpdate, 'config', newConfig);
            }
            this.cyzsConfigVisible = false;
        },
        handleLotteryConfigConfirm(newConfig) {
            if (this.currentModuleIndex > -1) {
                const moduleToUpdate = this.configuredModules[this.currentModuleIndex];
                this.$set(moduleToUpdate, 'config', newConfig);
            }
            this.lotteryConfigVisible = false;
        },
		handlezytjConfigConfirm(newConfig) {
		    if (this.currentModuleIndex > -1) {
		        const moduleToUpdate = this.configuredModules[this.currentModuleIndex];
		        this.$set(moduleToUpdate, 'config', newConfig);
		    }
		    this.zytjConfigVisible = false;
		},
		handlezytjConfigConfirm(newConfig) {
				    if (this.currentModuleIndex > -1) {
				        const moduleToUpdate = this.configuredModules[this.currentModuleIndex];
				        this.$set(moduleToUpdate, 'config', newConfig);
				    }
				    this.zytjConfigVisible = false;
				},
		
        // 判断是否为固定逻辑的环节（无需配置）
        isFixedModule(type) {
            const fixedModules = ['check-out'];
            return fixedModules.includes(type);
        },
        /**
         * 预览模块二维码
         */
        handlePreviewModuleQRCode(module) {
            const baseApi = process.env.VUE_APP_BASE_API;
            const activityId = this.activityData.activityId;
            const moduleId = module.id;

            this.moduleQRCodeDialog.title = `${module.title || module.name || moduleId}`;
            this.moduleQRCodeDialog.qrCodeUrl = `${baseApi}/activity/activity/module/qrcode/preview/${activityId}/${module.type}`;
            this.moduleQRCodeDialog.moduleInfo = `关卡信息：${module.title || module.name || moduleId}`;
            this.moduleQRCodeDialog.moduleId = moduleId;
            this.moduleQRCodeDialog.visible = true;
            this.moduleQRCodeDialog.moduleType = module.type;
        },

        /**
         * 下载模块二维码
         */
        handleDownloadModuleQRCode() {
            const baseApi = process.env.VUE_APP_BASE_API;
            const activityId = this.activityData.activityId;
            const url = `${baseApi}/activity/activity/module/qrcode/download/${activityId}/${this.moduleQRCodeDialog.moduleType}`;

            // 使用fetch下载文件
            fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + this.$store.getters.token
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    // 创建下载链接
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${this.moduleQRCodeDialog.title}.png`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);

                    this.$modal.msgSuccess("二维码下载成功");
                })
                .catch(error => {
                    console.error('下载失败:', error);
                    this.$modal.msgError("二维码下载失败，请重试");
                });
        }
    },
};
</script>

<style scoped>
.module-config-container {
    display: flex;
    gap: 20px;
    height: 60vh;
}

.toolbox, .timeline {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 15px;
    flex: 1;
}

.heading {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #303133;
}

.draggable-list {
    min-height: 200px;
    height: calc(100% - 40px);
    overflow-y: auto;
}

.module-item {
    background: #f4f4f5;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 4px;
    cursor: grab;
    display: flex;
    align-items: center;
    gap: 10px;
}

.configured-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border: 1px solid #e9e9eb;
    margin-bottom: 10px;
    border-radius: 4px;
    background: #fff;
}

.handle {
    cursor: move;
    font-size: 20px;
    color: #c0c4cc;
    margin-right: 15px;
}

.module-info {
    flex-grow: 1;
    display: flex;
    align-items: center;
}

.module-name {
    font-weight: 500;
}

.blocking-switch {
    margin-left: 20px;
}

.module-actions {
    margin-left: auto;
    padding-left: 20px;
    display: flex;
    gap: 10px;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #909399;
}
</style>
