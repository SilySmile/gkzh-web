<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>学生签到</span>
      </div>
      
      <el-form ref="form" :model="form" :rules="rules" label-width="120px" style="max-width: 500px;">
        <el-form-item label="学校" prop="schoolId">
          <el-select v-model="form.schoolId" placeholder="请选择学校" @change="handleSchoolChange" style="width: 100%;">
            <el-option
              v-for="school in schoolOptions"
              :key="school.schoolId"
              :label="school.title"
              :value="school.schoolId"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <!-- 动态显示院系选择 -->
        <el-form-item v-if="showCollegeSelect" label="院系" prop="collegeId">
          <el-select v-model="form.collegeId" placeholder="请选择院系" @change="handleCollegeChange" style="width: 100%;">
            <el-option
              v-for="college in collegeOptions"
              :key="college.departmentId"
              :label="college.title"
              :value="college.departmentId"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <!-- 动态显示专业选择 -->
        <el-form-item :label="showCollegeSelect ? '专业' : '专业'" prop="departmentId">
          <el-select v-model="form.departmentId" placeholder="请选择专业" style="width: 100%;">
            <el-option
              v-for="dept in departmentOptions"
              :key="dept.departmentId"
              :label="dept.title"
              :value="dept.departmentId"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="学号" prop="studentNo">
          <el-input v-model="form.studentNo" placeholder="请输入学号" />
        </el-form-item>
        
        <el-form-item label="姓名" prop="studentName">
          <el-input v-model="form.studentName" placeholder="请输入姓名" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading" style="width: 100%;">
            {{ loading ? '签到中...' : '立即签到' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 签到结果提示 -->
    <el-dialog title="签到结果" :visible.sync="resultVisible" width="400px" :close-on-click-modal="false">
      <div style="text-align: center;">
        <i :class="resultIcon" :style="{ fontSize: '48px', color: resultColor }"></i>
        <p style="margin-top: 20px; font-size: 16px;">{{ resultMessage }}</p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="resultVisible = false">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { studentCheckin } from "@/api/school/checkin";
import { listSchool } from "@/api/school/school";
import { listDepartment, getDepartmentTree } from "@/api/school/department";

export default {
  name: "StudentCheckinPage",
  data() {
    return {
      // 表单参数
      form: {
        schoolId: null,
        collegeId: null,
        departmentId: null,
        studentNo: '',
        studentName: ''
      },
      // 表单校验
      rules: {
        schoolId: [
          { required: true, message: "请选择学校", trigger: "change" }
        ],
        collegeId: [
          { required: true, message: "请选择院系", trigger: "change" }
        ],
        departmentId: [
          { required: true, message: "请选择专业", trigger: "change" }
        ],
        studentNo: [
          { required: true, message: "请输入学号", trigger: "blur" }
        ],
        studentName: [
          { required: true, message: "请输入姓名", trigger: "blur" }
        ]
      },
      // 学校选项
      schoolOptions: [],
      // 专业选项
      departmentOptions: [],
      // 加载状态
      loading: false,
      // 结果弹窗
      resultVisible: false,
      resultMessage: '',
      resultIcon: '',
      resultColor: '',
      // 动态显示院系选择
      showCollegeSelect: false,
      // 院系选项
      collegeOptions: [],
      // 当前学校的部门层级结构
      departmentStructure: null
    };
  },
  created() {
    this.getSchoolOptions();
  },
  methods: {
    /** 获取学校选项 */
    getSchoolOptions() {
      listSchool().then(response => {
        this.schoolOptions = response.rows;
      });
    },
    /** 获取部门树结构 */
    getDepartmentStructure(schoolId) {
      if (schoolId) {
        getDepartmentTree(schoolId).then(response => {
          this.departmentStructure = response.data;
          this.analyzeDepartmentStructure();
        });
      } else {
        this.departmentStructure = null;
        this.showCollegeSelect = false;
        this.collegeOptions = [];
        this.departmentOptions = [];
      }
    },
    /** 分析部门层级结构 */
    analyzeDepartmentStructure() {
      if (!this.departmentStructure || !Array.isArray(this.departmentStructure) || this.departmentStructure.length === 0) {
        this.showCollegeSelect = false;
        this.collegeOptions = [];
        this.departmentOptions = [];
        return;
      }

      const rootDepartments = this.departmentStructure;
      
      // 检查是否有二级结构（院系）
      const hasCollegeLevel = rootDepartments.some(dept => 
        dept.children && dept.children.length > 0
      );

      if (hasCollegeLevel) {
        // 学校-院系-专业 三级结构
        this.showCollegeSelect = true;
        this.collegeOptions = rootDepartments;
        this.departmentOptions = [];
      } else {
        // 学校-专业 二级结构
        this.showCollegeSelect = false;
        this.departmentOptions = rootDepartments;
      }
    },
    /** 获取专业选项 */
    getDepartmentOptions(parentId) {
      if (!parentId) {
        this.departmentOptions = [];
        return;
      }

      if (this.showCollegeSelect) {
        // 从院系下获取专业
        const selectedCollege = this.collegeOptions.find(college => college.departmentId === parentId);
        if (selectedCollege && selectedCollege.children) {
          this.departmentOptions = selectedCollege.children;
        } else {
          this.departmentOptions = [];
        }
      } else {
        // 直接从学校下获取专业
        if (this.departmentStructure && Array.isArray(this.departmentStructure)) {
          this.departmentOptions = this.departmentStructure;
        } else {
          this.departmentOptions = [];
        }
      }
    },
    /** 学校选择变化 */
    handleSchoolChange(schoolId) {
      this.form.collegeId = null;
      this.form.departmentId = null;
      this.getDepartmentStructure(schoolId);
    },
    /** 院系选择变化 */
    handleCollegeChange(collegeId) {
      this.form.departmentId = null;
      this.getDepartmentOptions(collegeId);
    },
    /** 提交签到 */
    submitForm() {
      // 动态设置验证规则
      const rules = { ...this.rules };
      
      // 如果不显示院系选择，移除院系验证
      if (!this.showCollegeSelect) {
        delete rules.collegeId;
      }
      
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.loading = true;
          studentCheckin(this.form).then(response => {
            this.loading = false;
            if (response.code === 200) {
              this.showResult('签到成功', 'el-icon-success', '#67C23A');
              this.resetForm();
            } else {
              this.showResult(response.msg || '签到失败', 'el-icon-error', '#F56C6C');
            }
          }).catch(error => {
            this.loading = false;
            this.showResult('签到失败，请重试', 'el-icon-error', '#F56C6C');
          });
        }
      });
    },
    /** 显示结果 */
    showResult(message, icon, color) {
      this.resultMessage = message;
      this.resultIcon = icon;
      this.resultColor = color;
      this.resultVisible = true;
    },
    /** 重置表单 */
    resetForm() {
      this.form = {
        schoolId: null,
        collegeId: null,
        departmentId: null,
        studentNo: '',
        studentName: ''
      };
      this.$refs["form"].resetFields();
      this.showCollegeSelect = false;
      this.collegeOptions = [];
      this.departmentOptions = [];
    }
  }
};
</script>

<style scoped>
.box-card {
  margin: 20px;
}
</style> 