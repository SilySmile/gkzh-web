<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div slot="header" class="header">
        <span>打印点蓝牙信标</span>
        <el-button size="mini" icon="el-icon-refresh" @click="load"
          >重新读取</el-button
        >
      </div>
      <p class="tip">
        启用后，小程序用扫描到的信号强度估算距离；身份匹配且估算距离不超过设置值才可选择打印机。公式：d
        = 10^((|RSSI| - A) / (10 × n))。A 填 1 米处 RSSI 的正数绝对值，例如实测
        -60 dBm 时填 60；n
        为环境衰减因子2.0（空旷），3.0-4.0（有遮挡）。保存后立即生效。
      </p>
      <el-form :model="form" label-width="145px" class="settings">
        <el-form-item label="启用蓝牙范围限制">
          <el-switch v-model="form.beaconEnabled" :disabled="!canEdit" />
          <span class="note">关闭时无需扫描信标</span>
        </el-form-item>
        <el-form-item label="默认最大距离">
          <el-input-number
            v-model="form.defaultMaxDistance"
            :disabled="!canEdit"
            :min="0.1"
            :max="100"
            :step="0.5"
            :precision="1"
          />
          米
          <span class="note"
            >单个信标未填写最大距离时使用；这是估算值，建议按现场实测调整</span
          >
        </el-form-item>
        <el-form-item label="检测结果有效期">
          <el-input-number
            v-model="form.maxAgeSeconds"
            :disabled="!canEdit"
            :min="1"
            :max="300"
            :step="1"
          />
          秒
          <span class="note">超过此时间后，提交打印前重新扫描</span>
        </el-form-item>
        <el-form-item label="小程序扫描超时">
          <el-input-number
            v-model="form.scanTimeoutSeconds"
            :disabled="!canEdit"
            :min="3"
            :max="60"
            :step="1"
          />
          秒
          <span class="note">超时仍未发现匹配信标时提示学生靠近重试</span>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <span>允许打印的信标（{{ form.beacons.length }} 个）</span>
        <el-button
          v-hasPermi="['zycck:beacon:edit']"
          size="small"
          icon="el-icon-plus"
          @click="addBeacon"
          >添加信标</el-button
        >
      </div>
      <el-table :data="pagedBeacons" border size="small" class="beacon-table">
        <el-table-column label="名称" min-width="130">
          <template slot-scope="scope"
            ><el-input
              v-model.trim="scope.row.name"
              :disabled="!canEdit"
              maxlength="100"
              placeholder="例如：东门打印点"
          /></template>
        </el-table-column>
        <el-table-column label="UUID" min-width="280">
          <template slot-scope="scope"
            ><el-input
              v-model.trim="scope.row.uuid"
              :disabled="!canEdit"
              placeholder="支持连续32位或带连字符的UUID"
          /></template>
        </el-table-column>
        <el-table-column label="Major（十进制）" width="135">
          <template slot-scope="scope"
            ><el-input
              v-model.trim="scope.row.major"
              :disabled="!canEdit"
              placeholder="留空不限"
          /></template>
        </el-table-column>
        <el-table-column label="Minor（十进制）" width="135">
          <template slot-scope="scope"
            ><el-input
              v-model.trim="scope.row.minor"
              :disabled="!canEdit"
              placeholder="留空不限"
          /></template>
        </el-table-column>
        <el-table-column label="最大估算距离(米)" width="150">
          <template slot-scope="scope"
            ><el-input
              v-model.trim="scope.row.maxDistance"
              :disabled="!canEdit"
              placeholder="默认"
          /></template>
        </el-table-column>
        <el-table-column label="1米参考值 A" width="140">
          <template slot-scope="scope"
            ><el-input
              v-model.trim="scope.row.referenceRssi"
              :disabled="!canEdit"
              placeholder="默认 60，填正数"
          /></template>
        </el-table-column>
        <el-table-column label="环境因子 n" width="130">
          <template slot-scope="scope"
            ><el-input
              v-model.trim="scope.row.pathLossExponent"
              :disabled="!canEdit"
              placeholder="默认 2.0"
          /></template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template slot-scope="scope"
            ><el-button
              v-hasPermi="['zycck:beacon:edit']"
              type="text"
              class="danger"
              @click="removeBeacon(scope.row)"
              >删除</el-button
            ></template
          >
        </el-table-column>
      </el-table>
      <pagination
        v-show="form.beacons.length > 0"
        :total="form.beacons.length"
        :page.sync="pageNum"
        :limit.sync="pageSize"
        @pagination="pageChanged"
      />
      <div class="actions">
        <el-button
          v-hasPermi="['zycck:beacon:edit']"
          type="primary"
          :loading="saving"
          @click="save"
          >保存配置</el-button
        >
      </div>
    </el-card>
  </div>
</template>

<script>
import {
  getBeaconConfig,
  saveBeaconConfig,
  zycckErrorMessage,
} from "@/api/zycck";

export default {
  name: "ZycckBeacons",
  data() {
    return {
      loading: false,
      saving: false,
      pageNum: 1,
      pageSize: 10,
      form: {
        beaconEnabled: false,
        beacons: [],
        defaultMaxDistance: 3,
        defaultMinRssi: -90,
        maxAgeSeconds: 15,
        scanTimeoutSeconds: 10,
      },
    };
  },
  computed: {
    canEdit() {
      const permissions = this.$store.getters.permissions || [];
      return (
        permissions.includes("*:*:*") ||
        permissions.includes("zycck:beacon:edit")
      );
    },
    // 分页只影响页面显示；保存时仍提交全部信标，翻页不会丢失已编辑内容。
    pagedBeacons() {
      const start = (this.pageNum - 1) * this.pageSize;
      return this.form.beacons.slice(start, start + this.pageSize);
    },
  },
  created() {
    this.load();
  },
  methods: {
    // 从服务端读取数据库配置；它也是学生端打印校验使用的配置。
    load() {
      this.loading = true;
      getBeaconConfig()
        .then((res) => {
          const data = (res && res.data) || res || {};
          this.form = {
            beaconEnabled: !!data.beaconEnabled,
            beacons: (data.beacons || []).map((item) => ({ ...item })),
            defaultMaxDistance: data.defaultMaxDistance,
            defaultMinRssi: data.defaultMinRssi,
            maxAgeSeconds: data.maxAgeSeconds,
            scanTimeoutSeconds: data.scanTimeoutSeconds,
          };
          this.pageChanged();
        })
        .catch((e) => this.$modal.msgError(zycckErrorMessage(e)))
        .finally(() => {
          this.loading = false;
        });
    },
    pageChanged() {
      this.pageNum = Math.min(
        this.pageNum,
        Math.max(1, Math.ceil(this.form.beacons.length / this.pageSize)),
      );
    },
    addBeacon() {
      if (this.form.beacons.length >= 50)
        return this.$modal.msgError("最多配置 50 个信标");
      this.form.beacons.push({
        name: "",
        uuid: "",
        major: "",
        minor: "",
        maxDistance: "",
        referenceRssi: "",
        pathLossExponent: "",
      });
      this.pageNum = Math.ceil(this.form.beacons.length / this.pageSize);
    },
    removeBeacon(row) {
      const index = this.form.beacons.indexOf(row);
      if (index >= 0) this.form.beacons.splice(index, 1);
      this.pageChanged();
    },
    optionalNumber(value, label, min, max, integer) {
      if (value === "" || value === null || value === undefined) return null;
      // 管理页面统一填写十进制，避免把设备说明书中的十六进制值误当十进制使用。
      if (typeof value === "string" && !/^-?\d+(\.\d+)?$/.test(value)) {
        throw new Error(label + "请填写十进制数字");
      }
      const number = Number(value);
      if (
        !Number.isFinite(number) ||
        number < min ||
        number > max ||
        (integer && !Number.isInteger(number))
      ) {
        throw new Error(
          label +
            "应为" +
            min +
            "至" +
            max +
            "之间的" +
            (integer ? "整数" : "数字"),
        );
      }
      return number;
    },
    save() {
      try {
        // UUID 可输入 32 位连续字符或带连字符格式，保存前统一转换为标准格式。
        const compactPattern = /^[0-9a-fA-F]{32}$/;
        const canonicalPattern =
          /^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/;
        const beacons = this.form.beacons.map((item, index) => {
          const rawUuid = String(item.uuid || "").trim();
          if (
            !compactPattern.test(rawUuid) &&
            !canonicalPattern.test(rawUuid)
          ) {
            this.pageNum = Math.floor(index / this.pageSize) + 1;
            throw new Error("第 " + (index + 1) + " 个信标的 UUID 格式不正确");
          }
          const compactUuid = rawUuid.replace(/-/g, "").toUpperCase();
          const uuid =
            compactUuid.slice(0, 8) +
            "-" +
            compactUuid.slice(8, 12) +
            "-" +
            compactUuid.slice(12, 16) +
            "-" +
            compactUuid.slice(16, 20) +
            "-" +
            compactUuid.slice(20);
          return {
            name: item.name || "",
            uuid,
            major: this.optionalNumber(item.major, "Major", 0, 65535, true),
            minor: this.optionalNumber(item.minor, "Minor", 0, 65535, true),
            maxDistance: this.optionalNumber(
              item.maxDistance,
              "最大距离",
              0.01,
              100,
              false,
            ),
            referenceRssi: this.optionalNumber(
              item.referenceRssi,
              "1米参考值 A",
              20,
              100,
              false,
            ),
            pathLossExponent: this.optionalNumber(
              item.pathLossExponent,
              "环境因子 n",
              1,
              6,
              false,
            ),
          };
        });
        if (this.form.beaconEnabled && !beacons.length)
          throw new Error("启用蓝牙限制前请至少添加一个信标");
        this.saving = true;
        // 服务端保存成功后会清除 Redis 缓存，学生端随后读取新规则。
        saveBeaconConfig({ ...this.form, beacons })
          .then(() => {
            this.$modal.msgSuccess("信标配置已保存并生效");
            this.load();
          })
          .catch((e) => this.$modal.msgError(zycckErrorMessage(e)))
          .finally(() => {
            this.saving = false;
          });
      } catch (e) {
        this.$modal.msgError(e.message);
      }
    },
  },
};
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
.tip,
.note {
  color: #909399;
  font-size: 13px;
}
.note {
  margin-left: 12px;
}
.settings {
  margin-top: 16px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0 10px;
  font-weight: 600;
}
.beacon-table {
  width: 100%;
}
.danger {
  color: #f56c6c;
}
.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
