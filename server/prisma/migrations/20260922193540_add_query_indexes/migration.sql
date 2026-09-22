-- CreateIndex
CREATE INDEX "Application_userId_createdAt_idx" ON "Application"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Application_userId_status_idx" ON "Application"("userId", "status");

-- CreateIndex
CREATE INDEX "ApplicationActivity_applicationId_createdAt_idx" ON "ApplicationActivity"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "Interview_applicationId_dateTime_idx" ON "Interview"("applicationId", "dateTime");
