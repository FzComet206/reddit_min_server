import { Field, ID, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
@ObjectType()  // both object type and entity
export class Post extends BaseEntity{

    @Field(()=> ID)   // this is exposing column to graphql schema
    @PrimaryGeneratedColumn()
    id: number;

    @Field(()=> String)
    @Column({type: "varchar", default: "Admin"})
    username: string;

    @Field(()=> String)
    @Column({type: "varchar"})
    title: string;

    @Field(()=> String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(()=> String)
    @UpdateDateColumn()
    updatedAt: Date;

}
