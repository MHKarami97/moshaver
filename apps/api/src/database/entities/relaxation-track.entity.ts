import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("relaxation_tracks")
export class RelaxationTrack {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ length: 180 }) title!: string;
  @Column({ length: 120, default: "" }) artist!: string;
  @Column({ length: 1600 }) url!: string;
  @Column({ default: true }) active!: boolean;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
