import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ActivityEvent } from "../../database/entities/activity-event.entity";
import { Student } from "../../database/entities/student.entity";
import { StudentPresence } from "../../database/entities/student-presence.entity";
import { Task } from "../../database/entities/task.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { ActivityController } from "./activity.controller";
import { ActivityService } from "./activity.service";
@Module({
  imports: [
    TypeOrmModule.forFeature([StudentPresence, ActivityEvent, Student, Task]),
    AuthorizationModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
