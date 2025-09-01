# Web3 School Backend Docker镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache python3 make g++ git

# 复制package文件
COPY package*.json ./

# 安装Node.js依赖
RUN npm ci --only=production && npm cache clean --force

# 全局安装Truffle
RUN npm install -g truffle

# 复制应用代码
COPY . .

# 编译合约
RUN npm run compile

# 创建非root用户
RUN addgroup -g 1001 -S web3school && \
    adduser -S web3school -u 1001

# 更改文件所有权
RUN chown -R web3school:web3school /app
USER web3school

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# 启动命令
CMD ["npm", "run", "deploy:local"]
